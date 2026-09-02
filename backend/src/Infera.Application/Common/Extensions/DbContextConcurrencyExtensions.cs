using Infera.Application.Common.Exceptions;
using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Extensions;

public static class DbContextConcurrencyExtensions
{
 
    public static async System.Threading.Tasks.Task SaveChangesWithConcurrencyCheckAsync(this IAppDbContext db, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException();
        }
    }
}