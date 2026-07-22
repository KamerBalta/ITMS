using Infera.Application.Common.Interfaces;
using Infera.Application.Features.Auth.Login;
using Infera.Domain.Entities;
using Infera.Infrastructure.Identity;
using Infera.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
}

app.Run();