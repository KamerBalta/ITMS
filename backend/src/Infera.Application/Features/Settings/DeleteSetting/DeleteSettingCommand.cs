using MediatR;

namespace Infera.Application.Features.Settings.DeleteSetting;

public record DeleteSettingCommand(Guid SettingId) : IRequest;