using MediatR;

namespace Infera.Application.Features.Labels.DeleteLabel;

public record DeleteLabelCommand(Guid LabelId) : IRequest;