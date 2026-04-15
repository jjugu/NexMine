using System.Linq;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Domain.Exceptions;

namespace Nexmine.Api.Middleware;

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
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "처리되지 않은 예외가 발생했습니다: {Message}", exception.Message);

        var problemDetails = exception switch
        {
            ForbiddenAccessException => CreateProblemDetails(StatusCodes.Status403Forbidden, "접근 거부", exception.Message, context.Request.Path),
            UnauthorizedAccessException => CreateProblemDetails(StatusCodes.Status401Unauthorized, "인증 필요", string.IsNullOrWhiteSpace(exception.Message) ? "인증이 필요합니다." : exception.Message, context.Request.Path),
            InvalidOperationException => CreateProblemDetails(StatusCodes.Status422UnprocessableEntity, "처리할 수 없음", exception.Message, context.Request.Path),
            KeyNotFoundException => CreateProblemDetails(StatusCodes.Status404NotFound, "찾을 수 없음", exception.Message, context.Request.Path),
            ValidationException validationException => CreateValidationProblemDetails(validationException, context.Request.Path),
            _ => CreateProblemDetails(StatusCodes.Status500InternalServerError, "서버 오류", "요청 처리 중 서버 오류가 발생했습니다.", context.Request.Path)
        };

        context.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problemDetails);
    }

    private static ProblemDetails CreateProblemDetails(int statusCode, string title, string detail, string instance)
    {
        return new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = instance
        };
    }

    private static ValidationProblemDetails CreateValidationProblemDetails(ValidationException exception, string instance)
    {
        var errors = exception.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).Distinct().ToArray());

        return new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "유효성 검증 실패",
            Detail = "입력값을 확인해주세요.",
            Instance = instance
        };
    }
}
