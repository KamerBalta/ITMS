using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceTaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetTaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkType = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskLinks_Tasks_SourceTaskId",
                        column: x => x.SourceTaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskLinks_Tasks_TargetTaskId",
                        column: x => x.TargetTaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskLinks_SourceTaskId",
                table: "TaskLinks",
                column: "SourceTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskLinks_TargetTaskId",
                table: "TaskLinks",
                column: "TargetTaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskLinks");
        }
    }
}
