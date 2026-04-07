using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexmine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    FieldFormat = table.Column<int>(type: "INTEGER", nullable: false),
                    Customizable = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsRequired = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsForAll = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsFilter = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    MinLength = table.Column<int>(type: "INTEGER", nullable: true),
                    MaxLength = table.Column<int>(type: "INTEGER", nullable: true),
                    Regexp = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    PossibleValuesJson = table.Column<string>(type: "TEXT", nullable: true),
                    DefaultValue = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomFields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CustomFieldProjects",
                columns: table => new
                {
                    CustomFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomFieldProjects", x => new { x.CustomFieldId, x.ProjectId });
                    table.ForeignKey(
                        name: "FK_CustomFieldProjects_CustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "CustomFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomFieldProjects_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomFieldTrackers",
                columns: table => new
                {
                    CustomFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    TrackerId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomFieldTrackers", x => new { x.CustomFieldId, x.TrackerId });
                    table.ForeignKey(
                        name: "FK_CustomFieldTrackers_CustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "CustomFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomFieldTrackers_Trackers_TrackerId",
                        column: x => x.TrackerId,
                        principalTable: "Trackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CustomFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomizableType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CustomizableId = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomValues_CustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "CustomFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomFieldProjects_ProjectId",
                table: "CustomFieldProjects",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomFields_Customizable_Position",
                table: "CustomFields",
                columns: new[] { "Customizable", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomFieldTrackers_TrackerId",
                table: "CustomFieldTrackers",
                column: "TrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomValues_CustomFieldId_CustomizableType_CustomizableId",
                table: "CustomValues",
                columns: new[] { "CustomFieldId", "CustomizableType", "CustomizableId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomFieldProjects");

            migrationBuilder.DropTable(
                name: "CustomFieldTrackers");

            migrationBuilder.DropTable(
                name: "CustomValues");

            migrationBuilder.DropTable(
                name: "CustomFields");
        }
    }
}
