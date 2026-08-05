using MediatR;

namespace Infera.Application.Features.Settings.UpsertSetting;

public record UpsertSettingCommand(string Key, string Value, Guid UpdatedBy) : IRequest<Guid>;