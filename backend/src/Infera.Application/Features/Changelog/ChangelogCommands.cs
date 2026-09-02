using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Changelog;

public record CreateChangelogEntryCommand(string Title, string Description, string Category) : IRequest<Guid>;
public record GetUnseenChangelogQuery : IRequest<List<ChangelogEntryDto>>;
public record GetAllChangelogQuery : IRequest<List<ChangelogEntryDto>>;
public record MarkChangelogSeenCommand : IRequest;

public record ChangelogEntryDto(Guid Id, string Title, string Description, string Category, DateTime PublishedAt);

public class CreateChangelogEntryCommandHandler : IRequestHandler<CreateChangelogEntryCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public CreateChangelogEntryCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateChangelogEntryCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin) throw new UnauthorizedAccessException("Yalnızca System Admin değişiklik günlüğü ekleyebilir.");

        var entry = new ChangelogEntry
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            CreatedByUserId = _currentUser.UserId,
        };
        _db.ChangelogEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry.Id;
    }
}

public class GetUnseenChangelogQueryHandler : IRequestHandler<GetUnseenChangelogQuery, List<ChangelogEntryDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public GetUnseenChangelogQueryHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<List<ChangelogEntryDto>> Handle(GetUnseenChangelogQuery request, CancellationToken ct)
    {
        var seen = await _db.UserChangelogSeen.FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId, ct);
        var lastSeenAt = seen?.LastSeenAt ?? DateTime.MinValue;

        return await _db.ChangelogEntries
            .Where(e => e.PublishedAt > lastSeenAt)
            .OrderByDescending(e => e.PublishedAt)
            .Take(10)
            .Select(e => new ChangelogEntryDto(e.Id, e.Title, e.Description, e.Category, e.PublishedAt))
            .ToListAsync(ct);
    }
}

public class GetAllChangelogQueryHandler : IRequestHandler<GetAllChangelogQuery, List<ChangelogEntryDto>>
{
    private readonly IAppDbContext _db;
    public GetAllChangelogQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<ChangelogEntryDto>> Handle(GetAllChangelogQuery request, CancellationToken ct)
    {
        return await _db.ChangelogEntries
            .OrderByDescending(e => e.PublishedAt)
            .Take(50)
            .Select(e => new ChangelogEntryDto(e.Id, e.Title, e.Description, e.Category, e.PublishedAt))
            .ToListAsync(ct);
    }
}

public class MarkChangelogSeenCommandHandler : IRequestHandler<MarkChangelogSeenCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public MarkChangelogSeenCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(MarkChangelogSeenCommand request, CancellationToken ct)
    {
        var seen = await _db.UserChangelogSeen.FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId, ct);
        if (seen is null)
            _db.UserChangelogSeen.Add(new UserChangelogSeen { UserId = _currentUser.UserId, LastSeenAt = DateTime.UtcNow });
        else
            seen.LastSeenAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}