namespace Nexmine.Application.Features.Issues.Dtos;

public class CopyIssueRequest
{
    public int TargetProjectId { get; set; }
    public bool CopyDescription { get; set; } = true;
    public bool CopyAttachments { get; set; } = false;
    public bool CopySubtasks { get; set; } = false;
    public bool CopyWatchers { get; set; } = false;
}
