namespace Infera.Domain.Enums;

public enum ProjectStatus { Active, Archived }

public enum SprintStatus { Active, Completed }

public enum Priority { Low, Medium, High, Critical }

public enum ItemStatus { ToDo, InProgress, ReadyForReview, ReadyForQA, Done, Closed }

public enum ProjectRole { ProjectManager, Developer, QA, Tester }

public enum NotificationType { Task, Sprint, Mention, Release }