using Infera.Application.Common.Interfaces;
using Infera.Application.Features.Auth.Login;
using Infera.Domain.Entities;
using Infera.Infrastructure.Identity;
using Infera.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            var allowedOrigins = builder.Configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>() ?? Array.Empty<string>();

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("LoginPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("ForgotPasswordPolicy", opt =>
    {
        opt.PermitLimit = 3;
        opt.Window = TimeSpan.FromHours(1);
        opt.QueueLimit = 0;
    });
});

Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy =>
        policy.RequireRole("System Admin"));

    options.AddPolicy("RequireProjectManager", policy =>
        policy.RequireRole("Project Manager", "System Admin"));

    options.AddPolicy("RequireDeveloper", policy =>
        policy.RequireRole("Developer", "Project Manager", "System Admin"));

    options.AddPolicy("RequireQA", policy =>
        policy.RequireRole("QA/Tester", "Project Manager", "System Admin"));
});

// Dependency Injection
builder.Services.AddScoped<IAppDbContext>(sp =>
    sp.GetRequiredService<AppDbContext>());

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<INotificationService, Infera.Application.Common.Services.NotificationService>();
builder.Services.AddScoped<IProjectAccessService, Infera.Application.Common.Services.ProjectAccessService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

builder.Services.AddValidatorsFromAssembly(typeof(LoginCommand).Assembly);

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly);
    cfg.AddOpenBehavior(typeof(Infera.Application.Common.Behaviors.ActivityLoggingBehavior<,>));
    cfg.AddOpenBehavior(typeof(Infera.Application.Common.Behaviors.ValidationBehavior<,>));
});

builder.Services.AddScoped<IFileStorageService, Infera.Infrastructure.Storage.LocalFileStorageService>();
builder.Services.AddHostedService<Infera.Infrastructure.BackgroundJobs.DueDateReminderService>();
builder.Services.AddScoped<IEmailService, Infera.Infrastructure.Email.ConsoleEmailService>();
builder.Services.AddScoped<ITaskStatusTransitionService, Infera.Application.Common.Services.TaskStatusTransitionService>();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("FrontendPolicy");
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<Infera.Api.Middleware.ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<Infera.Api.Middleware.AuditLogMiddleware>();

app.MapControllers();
app.MapHealthChecks("/health");

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { Name = "System Admin" },
            new Role { Name = "Project Manager" },
            new Role { Name = "Developer" },
            new Role { Name = "QA/Tester" });

        db.SaveChanges();
    }

    if (!db.Users.Any())
    {
        var adminRole = db.Roles.First(r => r.Name == "System Admin");

        var admin = new User
        {
            Name = "System Admin",
            Email = "admin@infera.local",
            PasswordHash = hasher.Hash("Admin123!"),
            IsActive = true
        };

        db.Users.Add(admin);
        db.SaveChanges();

        db.UserRoles.Add(new UserRole
        {
            UserId = admin.Id,
            RoleId = adminRole.Id
        });

        db.SaveChanges();
    }

    if (!db.SystemSettings.Any())
    {
        var admin = db.Users.First(u => u.Email == "admin@infera.local");

        db.SystemSettings.AddRange(
            new SystemSetting
            {
                Key = "MAX_FILE_SIZE_MB",
                Value = "25",
                UpdatedBy = admin.Id,
                UpdatedAt = DateTime.UtcNow
            },
            new SystemSetting
            {
                Key = "DEFAULT_SPRINT_DURATION_DAYS",
                Value = "30",
                UpdatedBy = admin.Id,
                UpdatedAt = DateTime.UtcNow
            },
            new SystemSetting
            {
                Key = "SESSION_TIMEOUT_MINUTES",
                Value = "15",
                UpdatedBy = admin.Id,
                UpdatedAt = DateTime.UtcNow
            });

        db.SaveChanges();
    }
}

app.Run();