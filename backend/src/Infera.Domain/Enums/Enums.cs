namespace Infera.Domain.Enums;

public enum ProjectStatus { Active, Archived }

public enum SprintStatus { Active, Completed }

public enum IssueType { Epic, Story, Task, Bug, SubTask }

public enum Priority { Low, Medium, High, Critical }

public enum ItemStatus { ToDo, InProgress, ReadyForReview, ReadyForQA, Done }

public enum ProjectRole { ProjectManager, Developer, QA, Tester }

public enum NotificationType { Task, Sprint, Mention, Release }