using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskEstimatesAndLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskLinks_Tasks_TargetTaskId",
                table: "TaskLinks");

            migrationBuilder.DropIndex(
                name: "IX_TaskLinks_SourceTaskId",
                table: "TaskLinks");

            migrationBuilder.AddColumn<int>(
                name: "OriginalEstimateMinutes",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RemainingEstimateMinutes",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "LinkType",
                table: "TaskLinks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_TaskLinks_SourceTaskId_TargetTaskId_LinkType",
                table: "TaskLinks",
                columns: new[] { "SourceTaskId", "TargetTaskId", "LinkType" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskLinks_Tasks_TargetTaskId",
                table: "TaskLinks",
                column: "TargetTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskLinks_Tasks_TargetTaskId",
                table: "TaskLinks");

            migrationBuilder.DropIndex(
                name: "IX_TaskLinks_SourceTaskId_TargetTaskId_LinkType",
                table: "TaskLinks");

            migrationBuilder.DropColumn(
                name: "OriginalEstimateMinutes",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "RemainingEstimateMinutes",
                table: "Tasks");

            migrationBuilder.AlterColumn<string>(
                name: "LinkType",
                table: "TaskLinks",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.CreateIndex(
                name: "IX_TaskLinks_SourceTaskId",
                table: "TaskLinks",
                column: "SourceTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskLinks_Tasks_TargetTaskId",
                table: "TaskLinks",
                column: "TargetTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
