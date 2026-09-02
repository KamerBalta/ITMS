import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../../lib/validation/authSchemas';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { queryClient } from '../../lib/queryClient';

export function LoginPage() {
    const navigate = useNavigate();
    const setTokens = useAuthStore((state) => state.setTokens);
    const setUser = useAuthStore((state) => state.setUser);

    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (values: LoginFormValues) => {
        setServerError(null);
        setIsSubmitting(true);
        try {
            const result = await authApi.login(values);

            // Eski kullanıcının tüm cache'ini temizle
            queryClient.clear();

            // Zustand store üzerinden seçili projeyi ve localStorage'ı temizle
            useProjectStore.getState().clearSelectedProject();

            setTokens(result.accessToken, result.refreshToken);
            setUser({
                userId: result.userId,
                userName: result.email,
                email: result.email,
                roles: result.roles,
            });

            navigate('/dashboard');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setServerError(axiosError.response?.data?.message ?? 'Giriş başarısız. Bilgilerinizi kontrol edin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow">
                <h1 className="text-2xl font-bold text-center mb-1">Hoş Geldiniz</h1>
                <p className="text-gray-500 text-center mb-6">Devam etmek için giriş yapın</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input
                            type="email"
                            placeholder="ad.soyad@itms.pro"
                            {...register('email')}
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Şifre</label>
                        <input
                            type="password"
                            {...register('password')}
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                    </div>

                    {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>

                    <div className="text-center">
                        <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                            Şifremi Unuttum
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}