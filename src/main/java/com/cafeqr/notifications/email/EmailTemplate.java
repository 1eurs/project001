package com.cafeqr.notifications.email;

/**
 * Generates branded Serva. HTML emails. Uses light-mode table layout so it renders
 * correctly across Gmail, Apple Mail, and Outlook without dark-mode overrides.
 *
 * Usage pattern:
 *   String html = EmailTemplate.build()
 *       .line("Hi Ahmed,")
 *       .line("Your café <strong>Mutrah Coffee</strong> is now live.")
 *       .button("https://serva.om/dashboard", "Go to dashboard")
 *       .divider()                     // starts Arabic section
 *       .rtl().line("مرحباً أحمد،")
 *       .html();
 */
public final class EmailTemplate {

    private static final String BG      = "#F0F4F1";
    private static final String CARD_BG = "#FFFFFF";
    private static final String BORDER  = "#D8E8E0";
    private static final String HEADER  = "#0F120E";
    private static final String TEXT    = "#0F120E";
    private static final String MUTED   = "#4B6358";
    private static final String ACCENT  = "#10b981";
    private static final String ACCENT_INK = "#03120D";
    private static final String CODE_BG = "#F0F7F4";
    private static final String CODE_BORDER = "#B8D8CC";

    private final StringBuilder body = new StringBuilder();
    private boolean rtl = false;

    private EmailTemplate() {}

    public static EmailTemplate build() { return new EmailTemplate(); }

    /** Switch subsequent content to RTL (Arabic section). */
    public EmailTemplate rtl() { this.rtl = true; return this; }

    /** A paragraph of text. Supports inline HTML like &lt;strong&gt;. */
    public EmailTemplate line(String html) {
        String align = rtl ? "right" : "left";
        String dir   = rtl ? " dir=\"rtl\"" : "";
        body.append("""
            <tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.65;\
color:%s;text-align:%s;"%s>%s</td></tr>
            """.formatted(TEXT, align, dir, html));
        return this;
    }

    /** A smaller muted line — good for subtitles or notes. */
    public EmailTemplate muted(String html) {
        String align = rtl ? "right" : "left";
        String dir   = rtl ? " dir=\"rtl\"" : "";
        body.append("""
            <tr><td style="padding:0 0 14px 0;font-size:13px;line-height:1.6;\
color:%s;text-align:%s;"%s>%s</td></tr>
            """.formatted(MUTED, align, dir, html));
        return this;
    }

    /** A highlighted box — use for reference codes, important values. */
    public EmailTemplate code(String label, String value) {
        String align = rtl ? "right" : "left";
        String dir   = rtl ? " dir=\"rtl\"" : "";
        body.append("""
            <tr><td style="padding:0 0 20px 0;"%s>
              <table width="100%%" cellpadding="0" cellspacing="0" style=\
"background:%s;border:1.5px solid %s;border-radius:10px;" align="%s">
                <tr><td style="padding:14px 18px;">
                  <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;\
color:%s;margin-bottom:4px;">%s</div>
                  <div style="font-size:20px;font-weight:700;letter-spacing:.06em;\
color:%s;font-family:Courier New,Courier,monospace;">%s</div>
                </td></tr>
              </table>
            </td></tr>
            """.formatted(dir, CODE_BG, CODE_BORDER, align, MUTED, label, TEXT, value));
        return this;
    }

    /** A table of key-value rows — bank details, order info etc. */
    public EmailTemplate kvTable(String... pairs) {
        if (pairs.length % 2 != 0) throw new IllegalArgumentException("pairs must be even");
        String dir = rtl ? " dir=\"rtl\"" : "";
        body.append("<tr><td style=\"padding:0 0 20px 0;\"").append(dir).append(">\n");
        body.append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
            .append("style=\"border-collapse:collapse;\">\n");
        for (int i = 0; i < pairs.length; i += 2) {
            String keyAlign = rtl ? "right" : "left";
            String valAlign = rtl ? "left" : "right";
            body.append("""
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:%s;text-align:%s;\
border-bottom:1px solid %s;">%s</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:%s;\
text-align:%s;border-bottom:1px solid %s;font-family:Courier New,Courier,monospace;">%s</td>
                </tr>
                """.formatted(MUTED, keyAlign, BORDER, pairs[i],
                              TEXT, valAlign, BORDER, pairs[i + 1]));
        }
        body.append("</table></td></tr>\n");
        return this;
    }

    /** A full-width CTA button. */
    public EmailTemplate button(String url, String label) {
        body.append("""
            <tr><td style="padding:6px 0 24px 0;text-align:center;">
              <a href="%s" style="display:inline-block;background:%s;color:%s;\
font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;\
letter-spacing:.01em;">%s</a>
            </td></tr>
            """.formatted(url, ACCENT, ACCENT_INK, label));
        return this;
    }

    /** A horizontal rule — visually separates the EN and AR sections. */
    public EmailTemplate divider() {
        body.append("""
            <tr><td style="padding:10px 0 24px 0;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background:%s;"></td>
                </tr>
              </table>
            </td></tr>
            """.formatted(BORDER));
        return this;
    }

    /** Returns the final HTML string. */
    public String html() {
        return """
            <!DOCTYPE html>
            <html lang="ar">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1"/>
              <meta name="color-scheme" content="light"/>
              <meta name="supported-color-schemes" content="light"/>
            </head>
            <body style="margin:0;padding:0;background:%s;font-family:\
-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:%s;">
                <tr><td align="center" style="padding:32px 16px 0 16px;">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="max-width:600px;width:100%%;">
                    <!-- header -->
                    <tr><td style="background:%s;border-radius:14px 14px 0 0;\
padding:22px 32px;display:block;">
                      <table width="100%%" cellpadding="0" cellspacing="0"><tr>
                        <td style="font-size:26px;font-weight:800;color:#FFFFFF;\
letter-spacing:-.01em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',\
Helvetica,Arial,sans-serif;">S.</td>
                        <td style="font-size:14px;font-weight:600;color:#10b981;\
letter-spacing:.08em;text-align:right;font-family:Courier New,Courier,monospace;">SERVA.</td>
                      </tr></table>
                    </td></tr>
                    <!-- card -->
                    <tr><td style="background:%s;border:1px solid %s;\
border-top:0;border-radius:0 0 14px 14px;padding:32px;">
                      <table width="100%%" cellpadding="0" cellspacing="0">
                        %s
                      </table>
                    </td></tr>
                    <!-- footer -->
                    <tr><td style="padding:20px 0 40px 0;text-align:center;">
                      <p style="margin:0;font-size:12px;color:%s;">
                        Serva. &mdash; <a href="https://serva.om" style="color:%s;\
text-decoration:none;">serva.om</a>
                      </p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(BG, BG, HEADER, CARD_BG, BORDER, body.toString(), MUTED, MUTED);
    }

    /** Helper: returns just the plain-text version from a matching builder. */
    public static String text(String content) { return content; }
}
