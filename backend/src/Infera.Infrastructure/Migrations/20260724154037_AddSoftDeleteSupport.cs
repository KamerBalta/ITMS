using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teams_Name",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_Labels_Name",
                table: "Labels");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Teams",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Teams",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Teams",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "TeamMembers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "TeamMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TeamMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "ProjectMembers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "ProjectMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ProjectMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Labels",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Labels",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Labels",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Comments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Comments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Comments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Attachments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Attachments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Attachments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Name",
                table: "Teams",
                column: "Name",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers",
                columns: new[] { "TeamId", "UserId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Labels_Name",
                table: "Labels",
                column: "Name",
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teams_Name",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_Labels_Name",
                table: "Labels");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Labels");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Labels");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Labels");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Attachments");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_Name",
                table: "Teams",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers",
                columns: new[] { "TeamId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Labels_Name",
                table: "Labels",
                column: "Name",
                unique: true);
        }
    }
}
