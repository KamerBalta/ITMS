using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTfvcAndPipelineSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AzureDevOpsOrgUrl",
                table: "ProjectGitIntegrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AzureDevOpsProjectName",
                table: "ProjectGitIntegrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChangedFilesJson",
                table: "GitCommitLinks",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceType",
                table: "GitCommitLinks",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "PipelineRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    PipelineName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Result = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PipelineUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Environment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RunAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PipelineRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PipelineRuns_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PipelineRuns_TaskId",
                table: "PipelineRuns",
                column: "TaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PipelineRuns");

            migrationBuilder.DropColumn(
                name: "AzureDevOpsOrgUrl",
                table: "ProjectGitIntegrations");

            migrationBuilder.DropColumn(
                name: "AzureDevOpsProjectName",
                table: "ProjectGitIntegrations");

            migrationBuilder.DropColumn(
                name: "ChangedFilesJson",
                table: "GitCommitLinks");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "GitCommitLinks");
        }
    }
}