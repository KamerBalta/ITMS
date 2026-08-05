using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDueDateReminderField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DueDateReminderSentAt",
                table: "Tasks",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DueDateReminderSentAt",
                table: "Tasks");
        }
    }
}
