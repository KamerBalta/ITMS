using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GlobalIssueTypeCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_ProjectIssueTypes_ProjectIssueTypeId",
                table: "Tasks");

            migrationBuilder.DropTable(
                name: "ProjectIssueTypes");

            migrationBuilder.RenameColumn(
                name: "ProjectIssueTypeId",
                table: "Tasks",
                newName: "IssueTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_ProjectIssueTypeId",
                table: "Tasks",
                newName: "IX_Tasks_IssueTypeId");

            migrationBuilder.CreateTable(
                name: "IssueTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Icon = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    CreatorTier = table.Column<int>(type: "integer", nullable: false),
                    AllowsChildren = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresParent = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystemDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IssueTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectIssueTypeAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectIssueTypeAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectIssueTypeAssignments_IssueTypes_IssueTypeId",
                        column: x => x.IssueTypeId,
                        principalTable: "IssueTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProjectIssueTypeAssignments_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IssueTypes_Name",
                table: "IssueTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectIssueTypeAssignments_IssueTypeId",
                table: "ProjectIssueTypeAssignments",
                column: "IssueTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectIssueTypeAssignments_ProjectId_IssueTypeId",
                table: "ProjectIssueTypeAssignments",
                columns: new[] { "ProjectId", "IssueTypeId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_IssueTypes_IssueTypeId",
                table: "Tasks",
                column: "IssueTypeId",
                principalTable: "IssueTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_IssueTypes_IssueTypeId",
                table: "Tasks");

            migrationBuilder.DropTable(
                name: "ProjectIssueTypeAssignments");

            migrationBuilder.DropTable(
                name: "IssueTypes");

            migrationBuilder.RenameColumn(
                name: "IssueTypeId",
                table: "Tasks",
                newName: "ProjectIssueTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_IssueTypeId",
                table: "Tasks",
                newName: "IX_Tasks_ProjectIssueTypeId");

            migrationBuilder.CreateTable(
                name: "ProjectIssueTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    AllowsChildren = table.Column<bool>(type: "boolean", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorTier = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Icon = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystemDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequiresParent = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectIssueTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectIssueTypes_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectIssueTypes_ProjectId_Name",
                table: "ProjectIssueTypes",
                columns: new[] { "ProjectId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_ProjectIssueTypes_ProjectIssueTypeId",
                table: "Tasks",
                column: "ProjectIssueTypeId",
                principalTable: "ProjectIssueTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
