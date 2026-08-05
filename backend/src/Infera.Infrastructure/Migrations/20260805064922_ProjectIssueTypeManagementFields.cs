using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ProjectIssueTypeManagementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ProjectIssueTypes",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "ProjectIssueTypes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "ProjectIssueTypes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystemDefault",
                table: "ProjectIssueTypes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "ProjectIssueTypes");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "ProjectIssueTypes");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "ProjectIssueTypes");

            migrationBuilder.DropColumn(
                name: "IsSystemDefault",
                table: "ProjectIssueTypes");
        }
    }
}
