using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVelocityAndBurndownAccuracy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommittedStoryPoints",
                table: "Sprints",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SprintBurndownSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SprintId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RemainingStoryPoints = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SprintBurndownSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SprintBurndownSnapshots_Sprints_SprintId",
                        column: x => x.SprintId,
                        principalTable: "Sprints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SprintBurndownSnapshots_SprintId_SnapshotDate",
                table: "SprintBurndownSnapshots",
                columns: new[] { "SprintId", "SnapshotDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SprintBurndownSnapshots");

            migrationBuilder.DropColumn(
                name: "CommittedStoryPoints",
                table: "Sprints");
        }
    }
}
