namespace Nexmine.Application.Features.Permissions;

public static class PermissionConstants
{
    // Project
    public const string ProjectView = "project.view";
    public const string ProjectEdit = "project.edit";
    public const string ProjectManage = "project.manage";
    public const string ProjectArchive = "project.archive";

    // Issue
    public const string IssueView = "issue.view";
    public const string IssueCreate = "issue.create";
    public const string IssueEdit = "issue.edit";
    public const string IssueEditOwn = "issue.edit_own";
    public const string IssueDelete = "issue.delete";
    public const string IssueComment = "issue.comment";
    public const string IssueAssign = "issue.assign";
    public const string IssueManageWatchers = "issue.manage_watchers";
    public const string IssueBulkEdit = "issue.bulk_edit";

    // Time Entry
    public const string TimeEntryCreate = "time_entry.create";
    public const string TimeEntryEdit = "time_entry.edit";
    public const string TimeEntryEditOwn = "time_entry.edit_own";
    public const string TimeEntryView = "time_entry.view";

    // Wiki
    public const string WikiView = "wiki.view";
    public const string WikiCreate = "wiki.create";
    public const string WikiEdit = "wiki.edit";
    public const string WikiDelete = "wiki.delete";

    // Document
    public const string DocumentView = "document.view";
    public const string DocumentCreate = "document.create";
    public const string DocumentEdit = "document.edit";
    public const string DocumentDelete = "document.delete";

    // Forum
    public const string ForumView = "forum.view";
    public const string ForumCreate = "forum.create";
    public const string ForumEdit = "forum.edit";
    public const string ForumDelete = "forum.delete";

    // News
    public const string NewsView = "news.view";
    public const string NewsCreate = "news.create";
    public const string NewsEdit = "news.edit";
    public const string NewsDelete = "news.delete";

    // Member
    public const string MemberManage = "member.manage";

    public static readonly Dictionary<string, string[]> AllGrouped = new()
    {
        ["project"] = [ProjectView, ProjectEdit, ProjectManage, ProjectArchive],
        ["issue"] = [IssueView, IssueCreate, IssueEdit, IssueEditOwn, IssueDelete, IssueComment, IssueAssign, IssueManageWatchers, IssueBulkEdit],
        ["time_entry"] = [TimeEntryCreate, TimeEntryEdit, TimeEntryEditOwn, TimeEntryView],
        ["wiki"] = [WikiView, WikiCreate, WikiEdit, WikiDelete],
        ["document"] = [DocumentView, DocumentCreate, DocumentEdit, DocumentDelete],
        ["forum"] = [ForumView, ForumCreate, ForumEdit, ForumDelete],
        ["news"] = [NewsView, NewsCreate, NewsEdit, NewsDelete],
        ["member"] = [MemberManage],
    };

    public static readonly Dictionary<string, string> GroupLabels = new()
    {
        ["project"] = "프로젝트",
        ["issue"] = "이슈",
        ["time_entry"] = "시간 기록",
        ["wiki"] = "위키",
        ["document"] = "문서",
        ["forum"] = "게시판",
        ["news"] = "뉴스",
        ["member"] = "멤버",
    };

    public static readonly string[] All = AllGrouped.Values.SelectMany(v => v).ToArray();
}
