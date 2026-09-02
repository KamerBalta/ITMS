namespace Infera.Infrastructure.Email;

// Basit ama kurumsal gorunumlu, tum e-postalarda ortak kullanilan HTML sablonu.
// Ekstra bir templating kutuphanesi (Razor vb.) kurmadan, tek bir string.Format tabanli sablon.
public static class EmailTemplateBuilder
{
    public static string Build(string title, string bodyText, string? actionUrl = null, string? actionLabel = null)
    {
        var buttonHtml = actionUrl is not null
            ? $"""
               <tr>
                 <td style="padding: 24px 32px;">
                   <a href="{actionUrl}" style="background-color:#4f46e5;color:#ffffff;text-decoration:none;
                     padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;">
                     {actionLabel ?? "Görüntüle"}
                   </a>
                 </td>
               </tr>
               """
            : "";

        return $"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                      style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background-color:#4f46e5;padding:20px 32px;">
                          <span style="color:#ffffff;font-size:18px;font-weight:700;"> ITMS</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px 32px 8px 32px;">
                          <h1 style="margin:0 0 12px 0;font-size:18px;color:#111827;">{title}</h1>
                          <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">{bodyText}</p>
                        </td>
                      </tr>
                      {buttonHtml}
                      <tr>
                        <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
                          <p style="margin:0;font-size:12px;color:#9ca3af;">
                            Bu e-posta  ITMS tarafından otomatik olarak gönderilmiştir.
                            Bildirim tercihlerinizi Profilim &gt; Bildirim Tercihleri bölümünden yönetebilirsiniz.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}