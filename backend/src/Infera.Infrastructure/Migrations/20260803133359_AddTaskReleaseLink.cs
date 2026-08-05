using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskReleaseLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReleaseId",
                table: "Tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ReleaseId",
                table: "Tasks",
                column: "ReleaseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Releases_ReleaseId",
                table: "Tasks",
                column: "ReleaseId",
                principalTable: "Releases",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Releases_ReleaseId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_ReleaseId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ReleaseId",
                table: "Tasks");
        }
    }
}
