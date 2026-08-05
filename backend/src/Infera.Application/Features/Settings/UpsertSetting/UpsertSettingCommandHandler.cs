using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Settings.UpsertSetting;

public class UpsertSettingCommandHandler : IRequestHandler<UpsertSettingCommand, Guid>
{
    private readonly IAppDbContext _db;
    public UpsertSettingCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<Guid> Handle(UpsertSettingCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
            throw new InvalidOperationException("Ayar anahtarı (Key) boş olamaz.");

        var setting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == request.Key, ct);

        if (setting is null)
        {
            setting = new SystemSetting
            {
                Key = request.Key,
                Value = request.Value,
                UpdatedBy = request.UpdatedBy,
                UpdatedAt = DateTime.UtcNow
            };
            _db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = request.Value;
            setting.UpdatedBy = request.UpdatedBy;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return setting.Id;
    }
}