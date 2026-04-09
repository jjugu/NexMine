using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupAdminAndDashboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AdminUserId",
                table: "UserGroups",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserGroups_AdminUserId",
                table: "UserGroups",
                column: "AdminUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserGroups_Users_AdminUserId",
                table: "UserGroups",
                column: "AdminUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserGroups_Users_AdminUserId",
                table: "UserGroups");

            migrationBuilder.DropIndex(
                name: "IX_UserGroups_AdminUserId",
                table: "UserGroups");

            migrationBuilder.DropColumn(
                name: "AdminUserId",
                table: "UserGroups");
        }
    }
}
