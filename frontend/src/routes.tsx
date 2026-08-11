import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RouteErrorPage } from './components/RouteErrorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ActivateAccountPage } from './pages/auth/ActivateAccountPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { IssueTypesManagementPage } from './pages/projects/IssueTypesManagementPage';
import { WorkflowEditorPage } from './pages/projects/WorkflowEditorPage';
import { CustomFieldsManagementPage } from './pages/projects/CustomFieldsManagementPage';
import { TeamsPage } from './pages/teams/TeamsPage';
import { KanbanBoardPage } from './pages/tasks/KanbanBoardPage';
import { BacklogPage } from './pages/backlog/BacklogPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { IssueTypeCatalogPage } from './pages/admin/IssueTypeCatalogPage';
import { ReleasesPage } from './pages/releases/ReleasesPage';
import { SearchPage } from './pages/search/SearchPage';
import { RetrospectivePage } from './pages/retrospective/RetrospectivePage';
import { IssueListPage } from './pages/issues/IssueListPage';
import { MyWorkPage } from './pages/mywork/MyWorkPage';
import { SprintDetailPage } from './pages/sprints/SprintDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AutomationRulesPage } from './pages/projects/AutomationRulesPage';
import { RoadmapPage } from './pages/roadmap/RoadmapPage';
import { ProjectPermissionsPage } from './pages/projects/ProjectPermissionsPage';

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <RouteErrorPage /> },
    { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <RouteErrorPage /> },
    { path: '/activate-account', element: <ActivateAccountPage />, errorElement: <RouteErrorPage /> },

    {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorPage />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <Navigate to="/dashboard" replace /> },
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/my-work', element: <MyWorkPage /> },
                    { path: '/projects', element: <ProjectsPage /> },
                    { path: '/projects/:projectId', element: <ProjectDetailPage /> },
                    { path: '/projects/:projectId/issue-types', element: <IssueTypesManagementPage /> },
                    { path: '/projects/:projectId/workflow', element: <WorkflowEditorPage /> },
                    { path: '/projects/:projectId/custom-fields', element: <CustomFieldsManagementPage /> },
                    { path: '/teams', element: <TeamsPage /> },
                    { path: '/board', element: <KanbanBoardPage /> },
                    { path: '/backlog', element: <BacklogPage /> },
                    { path: '/sprints/:sprintId', element: <SprintDetailPage /> },
                    { path: '/issues', element: <IssueListPage /> },
                    { path: '/tasks/:taskId', element: <TaskDetailPage /> },
                    { path: '/releases', element: <ReleasesPage /> },
                    { path: '/retrospective', element: <RetrospectivePage /> },
                    { path: '/reports', element: <ReportsPage /> },
                    { path: '/search', element: <SearchPage /> },
                    { path: '/notifications', element: <NotificationsPage /> },
                    { path: '/profile', element: <ProfilePage /> },
                    { path: '/admin/users', element: <UsersManagementPage /> },
                    { path: '/admin/users/:userId', element: <UserDetailPage /> },
                    { path: '/admin/settings', element: <SettingsPage /> },
                    { path: '/admin/issue-types', element: <IssueTypeCatalogPage /> },
                    { path: '/projects/:projectId/automation', element: <AutomationRulesPage /> },
                    { path: '/roadmap', element: <RoadmapPage /> },
                    { path: '/projects/:projectId/permissions', element: <ProjectPermissionsPage /> },
                    { path: '*', element: <NotFoundPage /> },
                ],
            },
        ],
    },

    { path: '*', element: <NotFoundPage /> },
]);