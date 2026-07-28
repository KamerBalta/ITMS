using MediatR;

namespace Infera.Application.Features.Tasks.CloseEpic;

public record CloseEpicCommand(Guid EpicId) : IRequest;