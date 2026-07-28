using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Settings.GetSettings;

public class GetSettingsQueryHandler : IRequestHandler<GetSettingsQuery, List<SettingDto>>
{
    private readonly IAppDbContext _db;
    public GetSettingsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<SettingDto>> Handle(GetSettingsQuery request, CancellationToken ct)
    {
        return await _db.SystemSettings
            .OrderBy(s => s.Key)
            .Select(s => new SettingDto(
                s.Id, s.Key, s.Value,
                s.UpdatedByUser != null ? s.UpdatedByUser.Name : null,
                s.UpdatedAt))
            .ToListAsync(ct);
    }
}