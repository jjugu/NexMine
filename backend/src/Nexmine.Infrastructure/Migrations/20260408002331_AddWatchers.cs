using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWatchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Watchers",
                columns: table => new
                {
                    WatchableType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    WatchableId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Watchers", x => new { x.WatchableType, x.WatchableId, x.UserId });
                    table.ForeignKey(
                        name: "FK_Watchers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Watchers_UserId",
                table: "Watchers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Watchers_WatchableType_WatchableId",
                table: "Watchers",
                columns: new[] { "WatchableType", "WatchableId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Watchers");
        }
    }
}
