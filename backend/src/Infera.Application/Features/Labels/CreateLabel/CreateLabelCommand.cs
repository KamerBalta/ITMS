using MediatR;

namespace Infera.Application.Features.Labels.CreateLabel;

public record CreateLabelCommand(string Name, string? Color) : IRequest<Guid>;