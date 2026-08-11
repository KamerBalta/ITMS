using FluentValidation;
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
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// CORS Policy Configuration
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

// Rate Limiting Configuration
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

// JWT Claim tiplerinin varsayılan dönüştürülmesini engeller (role/sub claim'leri korur)
Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Dependency Injection
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<INotificationService, Infera.Application.Common.Services.NotificationService>();
builder.Services.AddScoped<IProjectAccessService, Infera.Application.Common.Services.ProjectAccessService>();
builder.Services.AddScoped<ITaskStatusTransitionService, Infera.Application.Common.Services.TaskStatusTransitionService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IAutomationEngine, Infera.Application.Common.Services.AutomationEngine>();
builder.Services.AddScoped<IFileStorageService, Infera.Infrastructure.Storage.LocalFileStorageService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IProjectPermissionService, Infera.Application.Common.Services.ProjectPermissionService>();

// Dynamic Email Service Registration
var smtpHost = builder.Configuration["Smtp:Host"];
if (!string.IsNullOrWhiteSpace(smtpHost))
{
    builder.Services.AddScoped<IEmailService, Infera.Infrastructure.Email.SmtpEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, Infera.Infrastructure.Email.ConsoleEmailService>();
}

// Background Jobs
builder.Services.AddHostedService<Infera.Infrastructure.BackgroundJobs.DueDateReminderService>();
builder.Services.AddHostedService<Infera.Infrastructure.BackgroundJobs.BurndownSnapshotService>();

// FluentValidation & MediatR Configuration
builder.Services.AddValidatorsFromAssembly(typeof(LoginCommand).Assembly);
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly);
    cfg.AddOpenBehavior(typeof(Infera.Application.Common.Behaviors.ActivityLoggingBehavior<,>));
    cfg.AddOpenBehavior(typeof(Infera.Application.Common.Behaviors.ValidationBehavior<,>));
});

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
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

// Controllers + Swagger + Health Checks
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IRealtimeNotifier, Infera.Api.Realtime.SignalRRealtimeNotifier>();
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<Infera.Api.Middleware.ExceptionHandlingMiddleware>();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<Infera.Api.Middleware.AuditLogMiddleware>();

app.MapControllers();
app.MapHub<Infera.Api.Hubs.ProjectHub>("/hubs/project");
app.MapHealthChecks("/health");

// Database Seeding
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

        db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
        db.SaveChanges();
    }

    if (!db.SystemSettings.Any())
    {
        var admin = db.Users.First(u => u.Email == "admin@infera.local");
        db.SystemSettings.AddRange(
            new SystemSetting { Key = "MAX_FILE_SIZE_MB", Value = "25", UpdatedBy = admin.Id, UpdatedAt = DateTime.UtcNow },
            new SystemSetting { Key = "DEFAULT_SPRINT_DURATION_DAYS", Value = "30", UpdatedBy = admin.Id, UpdatedAt = DateTime.UtcNow },
            new SystemSetting { Key = "SESSION_TIMEOUT_MINUTES", Value = "15", UpdatedBy = admin.Id, UpdatedAt = DateTime.UtcNow });
        db.SaveChanges();
    }

    if (!db.IssueTypes.Any())
    {
        db.IssueTypes.AddRange(
            new IssueType { Name = "Epic", Icon = "📦", CreatorTier = 2, AllowsChildren = true, RequiresParent = false, IsSystemDefault = true },
            new IssueType { Name = "Story", Icon = "⭐", CreatorTier = 1, AllowsChildren = true, RequiresParent = false, IsSystemDefault = true },
            new IssueType { Name = "Task", Icon = "✅", CreatorTier = 0, AllowsChildren = true, RequiresParent = false, IsSystemDefault = true },
            new IssueType { Name = "Bug", Icon = "🐛", CreatorTier = 0, AllowsChildren = true, RequiresParent = false, IsSystemDefault = true });
        db.SaveChanges();
    }
    if (!db.Labels.Any())
    {
        var defaultLabels = new[] { "Urgent", "Frontend", "Backend", "API", "UI", "UX", "Bugfix", "Performance", "Security", "Documentation", "Enhancement" };
        db.Labels.AddRange(defaultLabels.Select(name => new Label { Name = name }));
        db.SaveChanges();
    }
}

app.Run();