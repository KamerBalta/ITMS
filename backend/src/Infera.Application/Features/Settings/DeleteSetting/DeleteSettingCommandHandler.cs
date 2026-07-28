using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Settings.DeleteSetting;

public class DeleteSettingCommandHandler : IRequestHandler<DeleteSettingCommand>
{
    private readonly IAppDbContext _db;
    public DeleteSettingCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(DeleteSettingCommand request, CancellationToken ct)
    {
        var setting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Id == request.SettingId, ct)
            ?? throw new KeyNotFoundException("Ayar bulunamadı.");

        _db.SystemSettings.Remove(setting);
        await _db.SaveChangesAsync(ct);
    }
}