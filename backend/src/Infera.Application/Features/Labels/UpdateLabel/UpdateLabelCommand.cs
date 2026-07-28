using MediatR;

namespace Infera.Application.Features.Labels.UpdateLabel;

public record UpdateLabelCommand(Guid LabelId, string Name, string? Color) : IRequest;