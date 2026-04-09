using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LocalizeKoreanSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "낮음");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "보통");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "높음");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "긴급");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "즉시");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "신규");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "진행 중");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "해결됨");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "피드백");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "종료");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "관리자");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "개발자");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "보고자");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "버그");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "기능");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "작업");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "지원");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Low");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Normal");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "High");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "Urgent");

            migrationBuilder.UpdateData(
                table: "IssuePriorities",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "Immediate");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "New");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "InProgress");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Resolved");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "Feedback");

            migrationBuilder.UpdateData(
                table: "IssueStatuses",
                keyColumn: "Id",
                keyValue: 5,
                column: "Name",
                value: "Closed");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Manager");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Developer");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Reporter");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Bug");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Feature");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Task");

            migrationBuilder.UpdateData(
                table: "Trackers",
                keyColumn: "Id",
                keyValue: 4,
                column: "Name",
                value: "Support");
        }
    }
}
