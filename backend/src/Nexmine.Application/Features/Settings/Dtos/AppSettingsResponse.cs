namespace Nexmine.Application.Features.Settings.Dtos;

public class AppSettingsResponse
{
    public string AppName { get; set; } = "Nexmine";
    public string? AppDescription { get; set; }
    public string PrimaryColor { get; set; } = "#1976d2";
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string DefaultLanguage { get; set; } = "ko";
    public string? GoogleClientId { get; set; }
}
