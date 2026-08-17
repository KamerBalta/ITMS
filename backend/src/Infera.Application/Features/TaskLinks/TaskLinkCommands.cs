using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.TaskLinks;

public record CreateTaskLinkCommand(Guid SourceTaskId, Guid TargetTaskId, string LinkType) : IRequest<Guid>;
public record DeleteTaskLinkCommand(Guid LinkId) : IRequest;
public record GetTaskLinksQuery(Guid TaskId) : IRequest<List<TaskLinkDto>>;

// Direction: "outgoing" (bu gorev X yapiyor) ya da "incoming" (bu goreve X yapiliyor) --
// UI'da "Blocks" / "Blocked by" gibi ters yonlu okunabilmesi icin.
public record TaskLinkDto(Guid LinkId, string LinkType, string Direction, Guid RelatedTaskId, string RelatedTaskTitle, string RelatedIssueKey, string RelatedStatus);

public static class TaskLinkTypes
{
    public static readonly string[] All = { "Blocks", "RelatesTo", "Duplicates" };

    // Ters yonden okundugunda kullanilacak etiket -- "A Blocks B" ise B tarafinda "Blocked by A" gorunur.
    public static string GetInverseLabel(string linkType) => linkType switch
    {
        "Blocks" => "BlockedBy",
        "RelatesTo" => "RelatesTo",
        "Duplicates" => "DuplicatedBy",
        _ => linkType,
    };
}

public class CreateTaskLinkCommandHandler : IRequestHandler<CreateTaskLinkCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public CreateTaskLinkCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateTaskLinkCommand request, CancellationToken ct)
    {
        if (request.SourceTaskId == request.TargetTaskId)
            throw new InvalidOperationException("Bir görev kendisiyle ilişkilendirilemez.");

        if (!TaskLinkTypes.All.Contains(request.LinkType))
            throw new InvalidOperationException("Geçersiz ilişki tipi.");

        var sourceTask = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.SourceTaskId, ct)
            ?? throw new KeyNotFoundException("Kaynak görev bulunamadı.");

        var targetTask = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TargetTaskId, ct)
            ?? throw new KeyNotFoundException("Hedef görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sourceTask.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        // Farkli projeler arasi iliskilendirmeye izin veriyoruz (Jira da destekler) ama hedef
        // projeye de erisimin olmasi lazim -- aksi halde baska bir projenin gorev basligini/durumunu
        // dolayli olarak gorebilirsin.
        if (!await _access.HasProjectAccessAsync(targetTask.ProjectId, ct))
            throw new UnauthorizedAccessException("Hedef göreve erişim yetkiniz yok.");

        var alreadyExists = await _db.TaskLinks
            .AnyAsync(l => l.SourceTaskId == request.SourceTaskId && l.TargetTaskId == request.TargetTaskId && l.LinkType == request.LinkType, ct);
        if (alreadyExists)
            throw new InvalidOperationException("Bu ilişki zaten mevcut.");

        var link = new TaskLink { SourceTaskId = request.SourceTaskId, TargetTaskId = request.TargetTaskId, LinkType = request.LinkType };
        _db.TaskLinks.Add(link);
        await _db.SaveChangesAsync(ct);

        return link.Id;
    }
}

public class DeleteTaskLinkCommandHandler : IRequestHandler<DeleteTaskLinkCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public DeleteTaskLinkCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(DeleteTaskLinkCommand request, CancellationToken ct)
    {
        var link = await _db.TaskLinks.Include(l => l.SourceTask).FirstOrDefaultAsync(l => l.Id == request.LinkId, ct)
            ?? throw new KeyNotFoundException("İlişki bulunamadı.");

        if (!await _access.HasProjectAccessAsync(link.SourceTask.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu ilişkiyi silme yetkiniz yok.");

        _db.TaskLinks.Remove(link);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetTaskLinksQueryHandler : IRequestHandler<GetTaskLinksQuery, List<TaskLinkDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetTaskLinksQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<TaskLinkDto>> Handle(GetTaskLinksQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var outgoing = await _db.TaskLinks
            .Where(l => l.SourceTaskId == request.TaskId)
            .Select(l => new TaskLinkDto(l.Id, l.LinkType, "outgoing", l.TargetTaskId, l.TargetTask.Title,
                l.TargetTask.Project.Key + "-" + l.TargetTask.TaskNumber, l.TargetTask.Status.ToString()))
            .ToListAsync(ct);

        var incoming = await _db.TaskLinks
            .Where(l => l.TargetTaskId == request.TaskId)
            .Select(l => new TaskLinkDto(l.Id, l.LinkType, "incoming", l.SourceTaskId, l.SourceTask.Title,
                l.SourceTask.Project.Key + "-" + l.SourceTask.TaskNumber, l.SourceTask.Status.ToString()))
            .ToListAsync(ct);

        return outgoing.Concat(incoming).ToList();
    }
}