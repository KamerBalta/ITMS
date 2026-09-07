using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardTypeAndBoardEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardColumns_Projects_ProjectId",
                table: "BoardColumns");

            migrationBuilder.DropForeignKey(
                name: "FK_BoardColumnSettings_Projects_ProjectId",
                table: "BoardColumnSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectWorkflowStatuses_BoardColumns_BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.DropIndex(
                name: "IX_ProjectWorkflowStatuses_BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.DropColumn(
                name: "BoardColumnId",
                table: "ProjectWorkflowStatuses");

            migrationBuilder.RenameColumn(
                name: "ProjectId",
                table: "BoardColumnSettings",
                newName: "BoardId");

            migrationBuilder.RenameIndex(
                name: "IX_BoardColumnSettings_ProjectId_BoardColumnId",
                table: "BoardColumnSettings",
                newName: "IX_BoardColumnSettings_BoardId_BoardColumnId");

            migrationBuilder.RenameColumn(
                name: "ProjectId",
                table: "BoardColumns",
                newName: "BoardId");

            migrationBuilder.RenameIndex(
                name: "IX_BoardColumns_ProjectId_Name",
                table: "BoardColumns",
                newName: "IX_BoardColumns_BoardId_Name");

            migrationBuilder.CreateTable(
                name: "Boards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    BoardType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boards_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardStatusColumnMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BoardId = table.Column<Guid>(type: "uuid", nullable: false),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    ColumnId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardStatusColumnMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardStatusColumnMappings_BoardColumns_ColumnId",
                        column: x => x.ColumnId,
                        principalTable: "BoardColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardStatusColumnMappings_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardStatusColumnMappings_ProjectWorkflowStatuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "ProjectWorkflowStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Boards_ProjectId",
                table: "Boards",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardStatusColumnMappings_BoardId_StatusId",
                table: "BoardStatusColumnMappings",
                columns: new[] { "BoardId", "StatusId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardStatusColumnMappings_ColumnId",
                table: "BoardStatusColumnMappings",
                column: "ColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardStatusColumnMappings_StatusId",
                table: "BoardStatusColumnMappings",
                column: "StatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardColumns_Boards_BoardId",
                table: "BoardColumns",
                column: "BoardId",
                principalTable: "Boards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BoardColumnSettings_Boards_BoardId",
                table: "BoardColumnSettings",
                column: "BoardId",
                principalTable: "Boards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardColumns_Boards_BoardId",
                table: "BoardColumns");

            migrationBuilder.DropForeignKey(
                name: "FK_BoardColumnSettings_Boards_BoardId",
                table: "BoardColumnSettings");

            migrationBuilder.DropTable(
                name: "BoardStatusColumnMappings");

            migrationBuilder.DropTable(
                name: "Boards");

            migrationBuilder.RenameColumn(
                name: "BoardId",
                table: "BoardColumnSettings",
                newName: "ProjectId");

            migrationBuilder.RenameIndex(
                name: "IX_BoardColumnSettings_BoardId_BoardColumnId",
                table: "BoardColumnSettings",
                newName: "IX_BoardColumnSettings_ProjectId_BoardColumnId");

            migrationBuilder.RenameColumn(
                name: "BoardId",
                table: "BoardColumns",
                newName: "ProjectId");

            migrationBuilder.RenameIndex(
                name: "IX_BoardColumns_BoardId_Name",
                table: "BoardColumns",
                newName: "IX_BoardColumns_ProjectId_Name");

            migrationBuilder.AddColumn<Guid>(
                name: "BoardColumnId",
                table: "ProjectWorkflowStatuses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectWorkflowStatuses_BoardColumnId",
                table: "ProjectWorkflowStatuses",
                column: "BoardColumnId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardColumns_Projects_ProjectId",
                table: "BoardColumns",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BoardColumnSettings_Projects_ProjectId",
                table: "BoardColumnSettings",
                column: "ProjectId",
                principalTable: "Projects",
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
    }
}
