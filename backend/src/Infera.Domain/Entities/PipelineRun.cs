using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class PipelineRun : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public string PipelineName { get; set; } = default!;
    public string Result { get; set; } = default!; // "Succeeded" | "Failed" | "InProgress" | "Cancelled"
    public string? PipelineUrl { get; set; }

    // Deployment bilgileri -- build'in kendisi deploy degilse null kalir.
    public string? Environment { get; set; } // "Development" | "Staging" | "Production"
    public string? Version { get; set; }
    public DateTime? DeployedAt { get; set; }

    public DateTime RunAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}