using FluentAssertions;
using Xunit;

namespace Infera.Tests;

// CreateTaskCommandHandler / CreateSubtaskCommandHandler icindeki hiyerarsi kontrolunun
// karar tablosunu izole test ediyoruz.
public class SubtaskHierarchyTests
{
    private static bool IsValidParent(bool childRequiresParent, bool parentAllowsChildren, bool parentRequiresParent)
    {
        if (!childRequiresParent) return true; // Sub-task olmayanlar icin parent zorunlu degil, her zaman gecerli
        if (parentAllowsChildren) return false; // Epic parent olamaz
        if (parentRequiresParent) return false; // Sub-task, Sub-task'in parent'i olamaz
        return true;
    }

    [Fact]
    public void SubtaskInParenti_EpicOlamaz()
    {
        IsValidParent(childRequiresParent: true, parentAllowsChildren: true, parentRequiresParent: false)
            .Should().BeFalse();
    }

    [Fact]
    public void SubtaskInParenti_BaskaSubtaskOlamaz()
    {
        IsValidParent(childRequiresParent: true, parentAllowsChildren: false, parentRequiresParent: true)
            .Should().BeFalse();
    }

    [Fact]
    public void SubtaskInParenti_MidTierGorevOlabilir()
    {
        IsValidParent(childRequiresParent: true, parentAllowsChildren: false, parentRequiresParent: false)
            .Should().BeTrue();
    }

    [Fact]
    public void MidTierGorevin_ParentiOpsiyoneldirVeEpicOlabilir()
    {
        IsValidParent(childRequiresParent: false, parentAllowsChildren: true, parentRequiresParent: false)
            .Should().BeTrue();
    }
}