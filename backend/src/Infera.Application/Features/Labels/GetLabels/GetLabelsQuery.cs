using MediatR;

namespace Infera.Application.Features.Labels.GetLabels;

public record GetLabelsQuery : IRequest<List<LabelDto>>;

public record LabelDto(Guid Id, string Name, string? Color);