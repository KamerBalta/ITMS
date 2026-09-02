using FluentValidation;
using Infera.Application.Common.Interfaces;
using Infera.Application.Features.Auth.Login;
using Infera.Domain.Entities;
using Infera.Infrastructure.Identity;
using Infera.Infrastructure.Persistence;
using Hangfire;
using Hangfire.PostgreSql;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// CORS Policy Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
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
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
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

    // Genel API limiti -- kimlik doğrulamalı her istek için kullanıcıya (IP fallback) göre
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var partitionKey = context.User.Identity?.IsAuthenticated == true
            ? context.User.FindFirst("sub")?.Value ?? "anonymous"
            : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            });
    });

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

    // Search ve Export -- veritabanı ağırlıklı maliyetli işlemler için sıkı limitler
    options.AddFixedWindowLimiter("SearchPolicy", opt =>
    {
        opt.PermitLimit = 30;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("ExportPolicy", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
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
builder.Services.AddScoped<IProjectManagementAuthService, Infera.Application.Common.Services.ProjectManagementAuthService>();
builder.Services.AddScoped<ITaskStatusTransitionService, Infera.Application.Common.Services.TaskStatusTransitionService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IAutomationEngine, Infera.Application.Common.Services.AutomationEngine>();

var storageProvider = builder.Configuration["Storage:Provider"];
if (storageProvider == "S3")
{
    builder.Services.AddScoped<Infera.Application.Common.Interfaces.IFileStorageService, Infera.Infrastructure.Storage.S3FileStorageService>();
}
else
{
    builder.Services.AddScoped<Infera.Application.Common.Interfaces.IFileStorageService, Infera.Infrastructure.Storage.LocalFileStorageService>();
}
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IFileContentValidator, Infera.Infrastructure.Storage.FileContentValidator>();

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IProjectPermissionService, Infera.Application.Common.Services.ProjectPermissionService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IFieldAuditLogger, Infera.Application.Common.Services.FieldAuditLogger>();

// Git Integration & Webhook Services
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IGitWebhookProcessor, Infera.Application.Common.Services.GitWebhookProcessor>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IWebhookSignatureValidator, Infera.Infrastructure.Services.WebhookSignatureValidator>();

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

builder.Services.AddScoped<Infera.Application.Common.Interfaces.IDueDateReminderJob, Infera.Infrastructure.BackgroundJobs.DueDateReminderService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IBurndownSnapshotJob, Infera.Infrastructure.BackgroundJobs.BurndownSnapshotService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IDigestEmailJob, Infera.Infrastructure.BackgroundJobs.DigestEmailService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IStaleTaskReminderJob, Infera.Infrastructure.BackgroundJobs.StaleTaskReminderService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.ISprintEndingSoonJob, Infera.Infrastructure.BackgroundJobs.SprintEndingSoonService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IExpiredTokenCleanupJob, Infera.Infrastructure.BackgroundJobs.ExpiredTokenCleanupService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IOverdueSprintReminderJob, Infera.Infrastructure.BackgroundJobs.OverdueSprintReminderService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IWeeklyProjectHealthReportJob, Infera.Infrastructure.BackgroundJobs.WeeklyProjectHealthReportService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IComponentLeadDigestJob, Infera.Infrastructure.BackgroundJobs.ComponentLeadDigestService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IOrphanedFileCleanupJob, Infera.Infrastructure.BackgroundJobs.OrphanedFileCleanupService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IInactiveUserDetectionJob, Infera.Infrastructure.BackgroundJobs.InactiveUserDetectionService>();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IBacklogGroomingReminderJob, Infera.Infrastructure.BackgroundJobs.BacklogGroomingReminderService>();

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
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return System.Threading.Tasks.Task.CompletedTask;
        },

        OnTokenValidated = async context =>
        {
            var db = context.HttpContext.RequestServices
                .GetRequiredService<AppDbContext>();

            var userIdClaim = context.Principal?
                .FindFirst("sub")?.Value;

            var tokenVersionClaim = context.Principal?
                .FindFirst("token_version")?.Value;

            if (!Guid.TryParse(userIdClaim, out var userId) ||
                !Guid.TryParse(tokenVersionClaim, out var tokenVersion))
            {
                context.Fail("Geçersiz oturum.");
                return;
            }

            var currentTokenVersion = await db.Users
                .Where(u => u.Id == userId && u.IsActive)
                .Select(u => (Guid?)u.TokenVersion)
                .FirstOrDefaultAsync();

            if (currentTokenVersion == null ||
                currentTokenVersion.Value != tokenVersion)
            {
                context.Fail("Oturum geçersiz.");
            }
        }
    };
});

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

builder.Services.AddControllers();
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "postgresql", tags: new[] { "ready" })
    .AddRedis(builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379", name: "redis", tags: new[] { "ready" });
builder.Services.AddSignalR();

// Redis Configuration (Resilient / Fallback Support)
builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    try
    {
        var options = StackExchange.Redis.ConfigurationOptions.Parse(builder.Configuration["Redis:ConnectionString"]!);
        options.AbortOnConnectFail = false;
        options.ConnectTimeout = 2000;
        return StackExchange.Redis.ConnectionMultiplexer.Connect(options);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Redis'e bağlanılamadı. Uygulama cache olmadan devam edecek.");
        return null!;
    }
});
builder.Services.AddScoped<Infera.Application.Common.Interfaces.ICacheService, Infera.Infrastructure.Caching.RedisCacheService>();

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(Hangfire.CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));

builder.Services.AddHangfireServer();
builder.Services.AddScoped<Infera.Application.Common.Interfaces.IRealtimeNotifier, Infera.Api.Realtime.SignalRRealtimeNotifier>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    var corsOrigins = app.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    if (corsOrigins.Length == 0)
    {
        app.Logger.LogWarning("Production ortamında Cors:AllowedOrigins boş! Hiçbir origin'e izin verilmeyecek (fail-closed). appsettings.Production.json'da bu değeri ayarlayın.");
    }
    else
    {
        app.Logger.LogInformation("CORS whitelist aktif: {Origins}", string.Join(", ", corsOrigins));
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<Infera.Api.Middleware.ExceptionHandlingMiddleware>();

// CORS middleware'i MapHub, MapControllers, Authentication ve Authorization oncesinde calismalidir
app.UseCors("Default");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<Infera.Api.Middleware.AuditLogMiddleware>();

app.MapControllers();

// #13: Health Check endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false, // hicbir bagimliliga bakma, sadece process ayakta mi (liveness)
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"), // DB ve Redis kontrolü (readiness)
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString(), description = e.Value.Description }),
        });
        await context.Response.WriteAsync(result);
    },
});

app.MapHub<Infera.Api.Hubs.ProjectHub>("/hubs/project");
app.MapHangfireDashboard("/hangfire");

// Hangfire Recurring Jobs
RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IDigestEmailJob>(
    "daily-digest-email", job => job.RunAsync(CancellationToken.None), "0 8 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IDueDateReminderJob>(
    "due-date-reminder", job => job.RunAsync(CancellationToken.None), "*/30 * * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IBurndownSnapshotJob>(
    "burndown-snapshot", job => job.RunAsync(CancellationToken.None), "0 */6 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IStaleTaskReminderJob>(
    "stale-task-reminder", job => job.RunAsync(CancellationToken.None), "0 9 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.ISprintEndingSoonJob>(
    "sprint-ending-soon", job => job.RunAsync(CancellationToken.None), "0 8 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IExpiredTokenCleanupJob>(
    "expired-token-cleanup", job => job.RunAsync(CancellationToken.None), "0 3 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IOverdueSprintReminderJob>(
    "overdue-sprint-reminder", job => job.RunAsync(CancellationToken.None), "0 9 * * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IWeeklyProjectHealthReportJob>(
    "weekly-project-health-report", job => job.RunAsync(CancellationToken.None), "0 7 * * 1");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IComponentLeadDigestJob>(
    "component-lead-digest", job => job.RunAsync(CancellationToken.None), "0 7 * * 1");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IOrphanedFileCleanupJob>(
    "orphaned-file-cleanup", job => job.RunAsync(CancellationToken.None), "0 4 * * 0");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IInactiveUserDetectionJob>(
    "inactive-user-detection", job => job.RunAsync(CancellationToken.None), "0 7 1 * *");

RecurringJob.AddOrUpdate<Infera.Application.Common.Interfaces.IBacklogGroomingReminderJob>(
    "backlog-grooming-reminder", job => job.RunAsync(CancellationToken.None), "0 8 * * 1");

// Seed Database
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