using MediatR;

namespace Infera.Application.Features.Labels.RemoveLabelFromTask;

public record RemoveLabelFromTaskCommand(Guid TaskId, Guid LabelId) : IRequest;