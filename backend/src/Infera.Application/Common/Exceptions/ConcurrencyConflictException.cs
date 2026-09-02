namespace Infera.Application.Common.Exceptions;


public class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException()
        : base("Bu görev, siz düzenlerken başka biri tarafından değiştirildi. Lütfen sayfayı yenileyip tekrar deneyin.")
    {
    }
}