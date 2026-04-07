using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowTransitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkflowTransitions",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false),
                    TrackerId = table.Column<int>(type: "INTEGER", nullable: false),
                    OldStatusId = table.Column<int>(type: "INTEGER", nullable: false),
                    NewStatusId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowTransitions", x => new { x.RoleId, x.TrackerId, x.OldStatusId, x.NewStatusId });
                    table.ForeignKey(
                        name: "FK_WorkflowTransitions_IssueStatuses_NewStatusId",
                        column: x => x.NewStatusId,
                        principalTable: "IssueStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowTransitions_IssueStatuses_OldStatusId",
                        column: x => x.OldStatusId,
                        principalTable: "IssueStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowTransitions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowTransitions_Trackers_TrackerId",
                        column: x => x.TrackerId,
                        principalTable: "Trackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_NewStatusId",
                table: "WorkflowTransitions",
                column: "NewStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_OldStatusId",
                table: "WorkflowTransitions",
                column: "OldStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_RoleId_TrackerId",
                table: "WorkflowTransitions",
                columns: new[] { "RoleId", "TrackerId" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_TrackerId",
                table: "WorkflowTransitions",
                column: "TrackerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkflowTransitions");
        }
    }
}
