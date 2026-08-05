using FluentValidation;
using System.Text.Json;

namespace Infera.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var errors = ex.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage });
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { errors }));
        }
        catch (Exception ex)
        {
            // Beklenmeyen (yakalanmamis) tum hatalar icin -- ayrinti disariya sizdirilmaz,
            // sadece sunucu tarafinda loglanir.
            _logger.LogError(ex, "Beklenmeyen bir hata oluştu: {Path}", context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                message = "Beklenmeyen bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."
            }));
        }
    }
}