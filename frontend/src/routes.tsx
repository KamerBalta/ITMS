import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { KanbanBoardPage } from './pages/tasks/KanbanBoardPage';
import { BacklogPage } from './pages/backlog/BacklogPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { TeamsPage } from './pages/teams/TeamsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },

    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <Navigate to="/dashboard" replace /> },
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/projects', element: <ProjectsPage /> },
                    { path: '/projects/:projectId', element: <ProjectDetailPage /> },
                    { path: '/board', element: <KanbanBoardPage /> },
                    { path: '/backlog', element: <BacklogPage /> },
                    { path: '/tasks/:taskId', element: <TaskDetailPage /> },
                    { path: '/teams', element: <TeamsPage /> },
                    { path: '/notifications', element: <NotificationsPage /> },
                    { path: '/profile', element: <ProfilePage /> },
                    { path: '/admin/users', element: <UsersManagementPage /> },
                    { path: '/admin/settings', element: <SettingsPage /> },
                ],
            },
        ],
    },

    { path: '*', element: <Navigate to="/" replace /> },
]);