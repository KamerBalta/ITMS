using MediatR;

namespace Infera.Application.Features.Labels.AddLabelToTask;

public record AddLabelToTaskCommand(Guid TaskId, Guid LabelId) : IRequest;