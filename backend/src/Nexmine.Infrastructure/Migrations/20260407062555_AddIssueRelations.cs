using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIssueRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IssueRelations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IssueFromId = table.Column<int>(type: "INTEGER", nullable: false),
                    IssueToId = table.Column<int>(type: "INTEGER", nullable: false),
                    RelationType = table.Column<int>(type: "INTEGER", nullable: false),
                    Delay = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IssueRelations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IssueRelations_Issues_IssueFromId",
                        column: x => x.IssueFromId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IssueRelations_Issues_IssueToId",
                        column: x => x.IssueToId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IssueRelations_IssueFromId_IssueToId",
                table: "IssueRelations",
                columns: new[] { "IssueFromId", "IssueToId" });

            migrationBuilder.CreateIndex(
                name: "IX_IssueRelations_IssueToId",
                table: "IssueRelations",
                column: "IssueToId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IssueRelations");
        }
    }
}
