package com.cafeqr.auth;

import com.cafeqr.auth.event.PasswordResetRequestedEvent;
import com.cafeqr.common.config.AppProperties;
import com.cafeqr.notifications.email.EmailMessage;
import com.cafeqr.notifications.email.EmailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Sends the password-reset link email, after commit so a rolled-back request never emails. */
@Component
public class AuthMailListener {

    private final EmailSender email;
    private final AppProperties appProperties;

    public AuthMailListener(EmailSender email, AppProperties appProperties) {
        this.email = email;
        this.appProperties = appProperties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onResetRequested(PasswordResetRequestedEvent e) {
        String link = baseUrl() + "/reset-password?token=" + e.token();
        String text = """
                Hi %s,

                We received a request to reset your Serva password. Open this link to set a new one
                (valid for 1 hour):

                %s

                If you didn't request this, you can ignore this email — your password won't change.

                — Serva

                ------------------------------------------------------------

                مرحباً %s،

                وصلنا طلب لإعادة تعيين كلمة مرور حسابك في Serva. افتح هذا الرابط لتعيين كلمة مرور جديدة
                (صالح لمدة ساعة واحدة):

                %s

                إذا لم تطلب ذلك، تجاهل هذه الرسالة ولن تتغيّر كلمة مرورك.
                """.formatted(e.name(), link, e.name(), link);
        email.send(new EmailMessage(e.email(), "Reset your Serva password", null, text));
    }

    private String baseUrl() {
        String b = appProperties.publicBaseUrl();
        return (b != null && !b.isBlank()) ? b.replaceAll("/+$", "") : "";
    }
}
