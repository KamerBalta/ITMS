using MediatR;

namespace Infera.Application.Features.Settings.GetSettings;

public record GetSettingsQuery : IRequest<List<SettingDto>>;

public record SettingDto(Guid Id, string Key, string Value, string? UpdatedByName, DateTime? UpdatedAt);