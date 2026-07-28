using MediatR;

namespace Infera.Application.Features.Search.GetSuggestions;

public record GetSuggestionsQuery(string Query) : IRequest<List<string>>;