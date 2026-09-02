using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard;

public record GetMyDashboardWidgetsQuery(Guid ProjectId) : IRequest<List<DashboardWidgetDto>>;
public record AddDashboardWidgetCommand(Guid ProjectId, string WidgetType, string? Title, int Width) : IRequest<Guid>;
public record RemoveDashboardWidgetCommand(Guid WidgetId) : IRequest;
public record UpdateDashboardWidgetCommand(Guid WidgetId, string? Title, int Width) : IRequest;
public record ReorderDashboardWidgetsCommand(Guid ProjectId, List<Guid> OrderedIds) : IRequest;
public record ResetDashboardWidgetsCommand(Guid ProjectId) : IRequest;

public record DashboardWidgetDto(Guid Id, string WidgetType, string? Title, int Width, int DisplayOrder);

public static class KnownWidgetTypes
{
    public static readonly string[] All = { "StatusSummary", "OverviewCards", "Burndown", "Velocity", "Workload", "MyOpenTasks", "RoadmapProgress", "QuickLinks" };
}

public class GetMyDashboardWidgetsQueryHandler : IRequestHandler<GetMyDashboardWidgetsQuery, List<DashboardWidgetDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly ICurrentUserService _currentUser;

    public GetMyDashboardWidgetsQueryHandler(IAppDbContext db, IProjectAccessService access, ICurrentUserService currentUser)
    {
        _db = db; _access = access; _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<List<DashboardWidgetDto>> Handle(GetMyDashboardWidgetsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var existing = await _db.DashboardWidgets
            .Where(w => w.UserId == _currentUser.UserId && w.ProjectId == request.ProjectId)
            .OrderBy(w => w.DisplayOrder)
            .ToListAsync(ct);

        if (existing.Count == 0)
        {
            var defaults = DashboardWidgetDefaults.BuildDefaults(_currentUser.UserId, request.ProjectId);
            _db.DashboardWidgets.AddRange(defaults);
            await _db.SaveChangesAsync(ct);
            existing = defaults;
        }

        return existing.Select(w => new DashboardWidgetDto(w.Id, w.WidgetType, w.Title, w.Width, w.DisplayOrder)).ToList();
    }
}

public class AddDashboardWidgetCommandHandler : IRequestHandler<AddDashboardWidgetCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public AddDashboardWidgetCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db; _currentUser = currentUser; _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddDashboardWidgetCommand request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        if (!KnownWidgetTypes.All.Contains(request.WidgetType))
            throw new InvalidOperationException("Geçersiz widget tipi.");

        if (request.Width is not (1 or 2))
            throw new InvalidOperationException("Genişlik yalnızca 1 (yarım) veya 2 (tam) olabilir.");

        var maxOrder = await _db.DashboardWidgets
            .Where(w => w.UserId == _currentUser.UserId && w.ProjectId == request.ProjectId)
            .Select(w => (int?)w.DisplayOrder)
            .MaxAsync(ct) ?? -1;

        var widget = new DashboardWidget
        {
            UserId = _currentUser.UserId,
            ProjectId = request.ProjectId,
            WidgetType = request.WidgetType,
            Title = request.Title,
            Width = request.Width,
            DisplayOrder = maxOrder + 1,
        };
        _db.DashboardWidgets.Add(widget);
        await _db.SaveChangesAsync(ct);
        return widget.Id;
    }
}

public class RemoveDashboardWidgetCommandHandler : IRequestHandler<RemoveDashboardWidgetCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public RemoveDashboardWidgetCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(RemoveDashboardWidgetCommand request, CancellationToken ct)
    {
        var widget = await _db.DashboardWidgets.FirstOrDefaultAsync(w => w.Id == request.WidgetId, ct)
            ?? throw new KeyNotFoundException("Widget bulunamadı.");

        // #Özelleştirilebilir-Dashboard: bir kullanici yalnizca KENDI widget'ini silebilir --
        // bu tamamen kisisel bir ayar, baska bir kullaniciyi etkilemez.
        if (widget.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu widget size ait değil.");

        _db.DashboardWidgets.Remove(widget);
        await _db.SaveChangesAsync(ct);
    }
}

public class UpdateDashboardWidgetCommandHandler : IRequestHandler<UpdateDashboardWidgetCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateDashboardWidgetCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateDashboardWidgetCommand request, CancellationToken ct)
    {
        var widget = await _db.DashboardWidgets.FirstOrDefaultAsync(w => w.Id == request.WidgetId, ct)
            ?? throw new KeyNotFoundException("Widget bulunamadı.");
        if (widget.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu widget size ait değil.");
        if (request.Width is not (1 or 2))
            throw new InvalidOperationException("Genişlik yalnızca 1 veya 2 olabilir.");

        widget.Title = request.Title;
        widget.Width = request.Width;
        await _db.SaveChangesAsync(ct);
    }
}

public class ReorderDashboardWidgetsCommandHandler : IRequestHandler<ReorderDashboardWidgetsCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public ReorderDashboardWidgetsCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(ReorderDashboardWidgetsCommand request, CancellationToken ct)
    {
        var widgets = await _db.DashboardWidgets
            .Where(w => w.UserId == _currentUser.UserId && w.ProjectId == request.ProjectId)
            .ToListAsync(ct);

        if (widgets.Count != request.OrderedIds.Count || widgets.Select(w => w.Id).Except(request.OrderedIds).Any())
            throw new InvalidOperationException("Sıralama listesi mevcut tüm widget'ları içermelidir.");

        for (int i = 0; i < request.OrderedIds.Count; i++)
            widgets.First(w => w.Id == request.OrderedIds[i]).DisplayOrder = i;

        await _db.SaveChangesAsync(ct);
    }
}

public class ResetDashboardWidgetsCommandHandler : IRequestHandler<ResetDashboardWidgetsCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public ResetDashboardWidgetsCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(ResetDashboardWidgetsCommand request, CancellationToken ct)
    {
        var existing = await _db.DashboardWidgets
            .Where(w => w.UserId == _currentUser.UserId && w.ProjectId == request.ProjectId)
            .ToListAsync(ct);
        _db.DashboardWidgets.RemoveRange(existing);

        var defaults = DashboardWidgetDefaults.BuildDefaults(_currentUser.UserId, request.ProjectId);
        _db.DashboardWidgets.AddRange(defaults);

        await _db.SaveChangesAsync(ct);
    }
}