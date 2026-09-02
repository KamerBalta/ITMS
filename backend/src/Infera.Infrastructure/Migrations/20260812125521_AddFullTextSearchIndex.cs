using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Infera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearchIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Task.Title uzerinde Turkce tam metin arama icin generated tsvector kolonu + GIN index.
            // 'simple' konfigurasyonu kullaniyoruz -- 'turkish' de mevcut ama 'simple' kok bulma yapmadan
            // kelime eslestirmesi yapar, arama davranisi daha ongorulebilir olur.
            migrationBuilder.Sql(@"
        ALTER TABLE ""Tasks"" ADD COLUMN ""SearchVector"" tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', coalesce(""Title"", ''))) STORED;

        CREATE INDEX ""IX_Tasks_SearchVector"" ON ""Tasks"" USING GIN (""SearchVector"");
    ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
        DROP INDEX IF EXISTS ""IX_Tasks_SearchVector"";
        ALTER TABLE ""Tasks"" DROP COLUMN IF EXISTS ""SearchVector"";
    ");
        }
    }
}
