using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardColumnsAndProjectDeletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BoardColumnSettings_ProjectId_Status",
                table: "BoardColumnSettings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "BoardColumnSettings");

            migrationBuilder.RenameColumn(
                name: "StatusId",
                table: "BoardColumnSettings",
                newName: "BoardColumnId");

            migrationBuilder.AddColumn<Guid>(
                name: "BoardColumnId",
                table: "ProjectWorkflowStatuses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BoardColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardColumns_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectWorkflowStatuses_BoardColumnId",
                table: "ProjectWorkflowStatuses",
                column: "BoardColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardColumnSettings_BoardColumnId",
                table: "BoardColumnSettings",
                column: "BoardColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardColumnSettings_ProjectId_BoardColumnId",
                table: "BoardColumnSettings",
                columns: new[] { "ProjectId", "BoardColumnId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardColumns_ProjectId_Name",
                table: "BoardColumns",
                columns: new[] { "ProjectId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BoardColumnSettings_BoardColumns_BoardColumnId",
                table: "BoardColumnSettings",
                column: "BoardColumnId",
                principalTable: "BoardColumns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectWorkflowStatuses_BoardColumns_BoardColumnId",
                table: "ProjectWorkflowStatuses",
                column: "BoardColumnId",
                principalTable: "BoardColumns",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardColumnSettings_BoardColumns_BoardColumnId",
                table: "BoardColumnSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectWorkflowStatuses_BoardColumns_BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.DropTable(
                name: "BoardColumns");

            migrationBuilder.DropIndex(
                name: "IX_ProjectWorkflowStatuses_BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.DropIndex(
                name: "IX_BoardColumnSettings_BoardColumnId",
                table: "BoardColumnSettings");

            migrationBuilder.DropIndex(
                name: "IX_BoardColumnSettings_ProjectId_BoardColumnId",
                table: "BoardColumnSettings");

            migrationBuilder.DropColumn(
                name: "BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.RenameColumn(
                name: "BoardColumnId",
                table: "BoardColumnSettings",
                newName: "StatusId");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "BoardColumnSettings",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_BoardColumnSettings_ProjectId_Status",
                table: "BoardColumnSettings",
                columns: new[] { "ProjectId", "Status" },
                unique: true);
        }
    }
}
