import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().min(1, 'E-posta zorunludur').email('Geçerli bir e-posta giriniz'),
    password: z.string().min(1, 'Parola zorunludur'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'E-posta zorunludur').email('Geçerli bir e-posta giriniz'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, 'Parola en az 8 karakter olmalıdır')
            .regex(/[A-Z]/, 'Parola en az bir büyük harf içermelidir')
            .regex(/[0-9]/, 'Parola en az bir rakam içermelidir'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Parolalar eşleşmiyor',
        path: ['confirmPassword'],
    });
export const activateAccountSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, 'Parola en az 8 karakter olmalıdır')
            .regex(/[A-Z]/, 'Parola en az bir büyük harf içermelidir')
            .regex(/[0-9]/, 'Parola en az bir rakam içermelidir'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Parolalar eşleşmiyor',
        path: ['confirmPassword'],
    });

export type ActivateAccountFormValues = z.infer<typeof activateAccountSchema>;


export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;