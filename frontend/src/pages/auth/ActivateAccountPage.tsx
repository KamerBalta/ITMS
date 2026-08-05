import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activateAccountSchema, type ActivateAccountFormValues } from '../../lib/validation/authSchemas';
import { authApi } from '../../api/auth';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';

export function ActivateAccountPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Şifre görünürlüğü state'leri
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ActivateAccountFormValues>({
        resolver: zodResolver(activateAccountSchema),
    });

    // Şifre alanlarını canlı takip etmek için watch kullanımı
    const newPasswordValue = watch('newPassword', '');
    const confirmPasswordValue = watch('confirmPassword', '');

    const onSubmit = async (values: ActivateAccountFormValues) => {
        setServerError(null);
        try {
            await authApi.activateAccount(token, values.newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setServerError(axiosError.response?.data?.message ?? 'Aktivasyon başarısız.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-xl border border-slate-200">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">Infera</h1>
                </div>

                {/* Geçersiz / Eksik Token Uyarısı */}
                {!token ? (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Geçersiz Bağlantı</h2>
                        <p className="text-sm text-gray-500">
                            Bu aktivasyon bağlantısı geçersiz veya süresi dolmuş. Lütfen yöneticinizle iletişime geçin.
                        </p>
                        <div className="pt-2">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline gap-1">
                                <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
                            </Link>
                        </div>
                    </div>
                ) : success ? (
                    /* Başarı Ekranı */
                    <div className="text-center space-y-4 py-4">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Hesabınız Oluşturuldu!</h2>
                        <p className="text-sm text-gray-600">
                            Hesabınız başarıyla aktifleştirildi. 2 saniye içinde giriş ekranına yönlendiriliyorsunuz...
                        </p>
                    </div>
                ) : (
                    /* Parola Belirleme Formu */
                    <>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Hesabınızı oluşturun</h1>
                            <p className="text-sm text-gray-500">Sisteme ilk girişiniz için güvenli bir parola belirleyin.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Yeni Parola Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Yeni Parola</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="🔒 Yeni Parola"
                                        {...register('newPassword')}
                                        className="w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
                            </div>

                            {/* Yeni Parola Tekrar Input */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Parolayı Tekrar Girin</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="🔒 Parolayı Tekrar Girin"
                                        {...register('confirmPassword')}
                                        className="w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                            </div>

                            {/* Parola Eşleşme Göstergesi */}
                            {confirmPasswordValue.length > 0 && (
                                <div className="flex items-center text-xs font-medium">
                                    {newPasswordValue === confirmPasswordValue ? (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Parolalar eşleşiyor
                                        </span>
                                    ) : (
                                        <span className="text-red-500 flex items-center gap-1">
                                            <XCircle className="w-3.5 h-3.5" /> Parolalar eşleşmiyor
                                        </span>
                                    )}
                                </div>
                            )}

                            
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                                <p className="font-semibold text-gray-700">Parolanız en az şunları içermelidir:</p>
                                <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                    <li className="flex items-center gap-1">• 8 karakter</li>
                                    <li className="flex items-center gap-1">• 1 büyük harf</li>
                                    <li className="flex items-center gap-1">• 1 küçük harf</li>
                                    <li className="flex items-center gap-1">• 1 rakam</li>
                                    <li className="flex items-center gap-1 col-span-2">• 1 özel karakter (!@#$%^&*)</li>
                                </ul>
                            </div>

                            {/* Sunucu Hatası */}
                            {serverError && <p className="text-red-500 text-xs font-medium">{serverError}</p>}

                            {/* Submit Butonu */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Parolayı Kaydet...
                                    </>
                                ) : (
                                    'Parolayı Kaydet'
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* Giriş Ekranına Dön */}
                <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline gap-1">
                        <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
                    </Link>
                </div>

            </div>
        </div>
    );
}