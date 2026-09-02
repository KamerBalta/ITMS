using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DynamicWorkflowStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkflowTransitions_ProjectId_FromStatus_ToStatus",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "FromStatus",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "ToStatus",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tasks");

            migrationBuilder.AddColumn<Guid>(
                name: "FromStatusId",
                table: "WorkflowTransitions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "WorkflowTransitions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ToStatusId",
                table: "WorkflowTransitions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "StatusId",
                table: "Tasks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "StatusId",
                table: "BoardColumnSettings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "ProjectWorkflowStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsInitial = table.Column<bool>(type: "boolean", nullable: false),
                    IsEpicCloseTarget = table.Column<bool>(type: "boolean", nullable: false),
                    IsDraft = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectWorkflowStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectWorkflowStatuses_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_FromStatusId",
                table: "WorkflowTransitions",
                column: "FromStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_ProjectId_FromStatusId_ToStatusId",
                table: "WorkflowTransitions",
                columns: new[] { "ProjectId", "FromStatusId", "ToStatusId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_ToStatusId",
                table: "WorkflowTransitions",
                column: "ToStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_StatusId",
                table: "Tasks",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectWorkflowStatuses_ProjectId_Name",
                table: "ProjectWorkflowStatuses",
                columns: new[] { "ProjectId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_ProjectWorkflowStatuses_StatusId",
                table: "Tasks",
                column: "StatusId",
                principalTable: "ProjectWorkflowStatuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowTransitions_ProjectWorkflowStatuses_FromStatusId",
                table: "WorkflowTransitions",
                column: "FromStatusId",
                principalTable: "ProjectWorkflowStatuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowTransitions_ProjectWorkflowStatuses_ToStatusId",
                table: "WorkflowTransitions",
                column: "ToStatusId",
                principalTable: "ProjectWorkflowStatuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_ProjectWorkflowStatuses_StatusId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowTransitions_ProjectWorkflowStatuses_FromStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowTransitions_ProjectWorkflowStatuses_ToStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropTable(
                name: "ProjectWorkflowStatuses");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowTransitions_FromStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowTransitions_ProjectId_FromStatusId_ToStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowTransitions_ToStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_StatusId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "FromStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "ToStatusId",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "BoardColumnSettings");

            migrationBuilder.AddColumn<string>(
                name: "FromStatus",
                table: "WorkflowTransitions",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ToStatus",
                table: "WorkflowTransitions",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTransitions_ProjectId_FromStatus_ToStatus",
                table: "WorkflowTransitions",
                columns: new[] { "ProjectId", "FromStatus", "ToStatus" },
                unique: true);
        }
    }
}
