import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../lib/validation/authSchemas';
import { authApi } from '../../api/auth';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (values: ResetPasswordFormValues) => {
        setServerError(null);
        try {
            await authApi.resetPassword(token, values.newPassword);
            navigate('/login');
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setServerError(axiosError.response?.data?.message ?? 'Bir hata oluştu.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow">
                <h1 className="text-xl font-bold mb-4">Yeni Parola Belirle</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Yeni parola"
                            {...register('newPassword')}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Yeni parola (tekrar)"
                            {...register('confirmPassword')}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Parolayı Sıfırla
                    </button>
                </form>

                <div className="text-center mt-4">
                    <Link to="/login" className="text-sm text-indigo-600 hover:underline">
                        Giriş ekranına dön
                    </Link>
                </div>
            </div>
        </div>
    );
}