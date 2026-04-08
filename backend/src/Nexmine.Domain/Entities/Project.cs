namespace Nexmine.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public bool IsArchived { get; set; }

    public List<ProjectMembership> Members { get; set; } = [];
    public List<Issue> Issues { get; set; } = [];
    public List<IssueCategory> Categories { get; set; } = [];
    public List<Version> Versions { get; set; } = [];
    public List<TimeEntry> TimeEntries { get; set; } = [];
    public List<WikiPage> WikiPages { get; set; } = [];
    public List<Document> Documents { get; set; } = [];
    public List<News> News { get; set; } = [];
    public List<IssueTemplate> IssueTemplates { get; set; } = [];
    public List<Forum> Forums { get; set; } = [];
}
