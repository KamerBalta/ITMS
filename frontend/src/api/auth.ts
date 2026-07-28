import { apiClient } from './client';
import type { LoginRequest, LoginResult, CurrentUser } from '../types/auth';

export const authApi = {
    login: (data: LoginRequest) =>
        apiClient.post<LoginResult>('/auth/login', data).then((res) => res.data),

    logout: (refreshToken: string) =>
        apiClient.post('/auth/logout', { refreshToken }),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }).then((res) => res.data),

    resetPassword: (resetToken: string, newPassword: string) =>
        apiClient.post('/auth/reset-password', { resetToken, newPassword }),

    me: () => apiClient.get<CurrentUser>('/auth/me').then((res) => res.data),
};