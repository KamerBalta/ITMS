using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceIssueTypeEnumWithProjectIssueType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssueType",
                table: "Tasks");

            migrationBuilder.AddColumn<bool>(
                name: "AllowsChildren",
                table: "ProjectIssueTypes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CreatorTier",
                table: "ProjectIssueTypes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresParent",
                table: "ProjectIssueTypes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowsChildren",
                table: "ProjectIssueTypes");

            migrationBuilder.DropColumn(
                name: "CreatorTier",
                table: "ProjectIssueTypes");

            migrationBuilder.DropColumn(
                name: "RequiresParent",
                table: "ProjectIssueTypes");

            migrationBuilder.AddColumn<int>(
                name: "IssueType",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
