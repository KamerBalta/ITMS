import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../lib/validation/authSchemas';
import { authApi } from '../../api/auth';

export function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (values: ForgotPasswordFormValues) => {
        await authApi.forgotPassword(values.email);
        setSubmitted(true); // Backend hep ayni mesaji donuyor -- kullanici var mi yok mu belli etmiyoruz (guvenlik)
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow">
                <h1 className="text-xl font-bold mb-4">Şifremi Unuttum</h1>

                {submitted ? (
                    <p className="text-gray-600">
                        E-posta adresiniz sistemde kayıtlıysa, sıfırlama bağlantısı gönderildi.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="E-posta adresiniz"
                                {...register('email')}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Sıfırlama Bağlantısı Gönder
                        </button>
                    </form>
                )}

                <div className="text-center mt-4">
                    <Link to="/login" className="text-sm text-indigo-600 hover:underline">
                        Giriş ekranına dön
                    </Link>
                </div>
            </div>
        </div>
    );
}