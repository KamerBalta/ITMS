using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGitIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GitCommitLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    CommitHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CommitMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CommitUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BranchName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CommittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GitCommitLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GitCommitLinks_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectGitIntegrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RepositoryUrl = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    WebhookSecret = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CloseTargetStatusId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectGitIntegrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectGitIntegrations_ProjectWorkflowStatuses_CloseTargetS~",
                        column: x => x.CloseTargetStatusId,
                        principalTable: "ProjectWorkflowStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProjectGitIntegrations_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GitCommitLinks_TaskId_CommitHash",
                table: "GitCommitLinks",
                columns: new[] { "TaskId", "CommitHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGitIntegrations_CloseTargetStatusId",
                table: "ProjectGitIntegrations",
                column: "CloseTargetStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGitIntegrations_ProjectId",
                table: "ProjectGitIntegrations",
                column: "ProjectId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GitCommitLinks");

            migrationBuilder.DropTable(
                name: "ProjectGitIntegrations");
        }
    }
}
