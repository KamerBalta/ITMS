using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardColumnWipLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardColumnSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    WipLimit = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardColumnSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardColumnSettings_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardColumnSettings_ProjectId_Status",
                table: "BoardColumnSettings",
                columns: new[] { "ProjectId", "Status" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardColumnSettings");
        }
    }
}
