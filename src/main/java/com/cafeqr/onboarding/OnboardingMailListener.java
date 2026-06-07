package com.cafeqr.onboarding;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.notifications.email.EmailMessage;
import com.cafeqr.notifications.email.EmailSender;
import com.cafeqr.onboarding.event.CafeActivatedEvent;
import com.cafeqr.onboarding.event.CafeRenewedEvent;
import com.cafeqr.onboarding.event.CafeSignedUpEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;

/**
 * Turns onboarding events into transactional emails, fired only <b>after the DB commits</b> so a
 * rolled-back signup/confirm never emails anyone. Bilingual (EN + AR) to match the product.
 */
@Component
public class OnboardingMailListener {

    private final EmailSender email;
    private final AppProperties appProperties;

    public OnboardingMailListener(EmailSender email, AppProperties appProperties) {
        this.email = email;
        this.appProperties = appProperties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSignedUp(CafeSignedUpEvent e) {
        email.send(instructionsEmail(e));

        String adminTo = appProperties.notifications() != null && appProperties.notifications().email() != null
                ? appProperties.notifications().email().adminAlertTo() : null;
        if (adminTo != null && !adminTo.isBlank()) {
            email.send(adminAlertEmail(adminTo, e));
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onActivated(CafeActivatedEvent e) {
        email.send(activatedEmail(e));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRenewed(CafeRenewedEvent e) {
        email.send(renewedEmail(e));
    }

    // ----------------------------------------------------------------- templates

    private EmailMessage instructionsEmail(CafeSignedUpEvent e) {
        AppProperties.Onboarding o = appProperties.onboarding();
        String amount = formatAmount(e.amount(), e.currency());
        String text = """
                Welcome to Serva, %s!

                To activate %s, transfer %s to the account below and put this reference in the transfer note:

                  Reference:      %s
                  Bank:           %s
                  Account name:   %s
                  Account number: %s
                  IBAN:           %s

                We'll activate your account once we confirm the transfer — then you can sign in.

                — Serva

                ------------------------------------------------------------

                مرحباً %s،

                لتفعيل %s، حوّل %s إلى الحساب أدناه واكتب الرمز المرجعي في ملاحظة التحويل:

                  الرمز المرجعي: %s
                  البنك:        %s
                  اسم الحساب:    %s
                  رقم الحساب:    %s
                  الآيبان:       %s

                سنفعّل حسابك فور تأكيد التحويل، وعندها يمكنك تسجيل الدخول.
                """.formatted(
                e.ownerName(), e.cafeName(), amount, e.reference(),
                bank(o), accName(o), accNo(o), iban(o),
                e.ownerName(), e.cafeName(), amount, e.reference(),
                bank(o), accName(o), accNo(o), iban(o));
        return new EmailMessage(e.ownerEmail(), "Complete your Serva signup — bank transfer details", null, text);
    }

    private EmailMessage activatedEmail(CafeActivatedEvent e) {
        String loginUrl = baseUrl() + "/dashboard";
        String text = """
                Your Serva account is live, %s! 🎉

                %s is now active. Sign in to set up your menu and QR codes:
                %s

                — Serva

                ------------------------------------------------------------

                تم تفعيل حسابك في Serva، %s! 🎉

                %s أصبح نشطاً الآن. سجّل الدخول لإعداد قائمتك ورموز QR:
                %s
                """.formatted(e.ownerName(), e.cafeName(), loginUrl, e.ownerName(), e.cafeName(), loginUrl);
        return new EmailMessage(e.ownerEmail(), "Your Serva account is live 🎉", null, text);
    }

    private EmailMessage renewedEmail(CafeRenewedEvent e) {
        String until = e.activeUntil() != null ? e.activeUntil().toString() : "";
        String text = """
                Thanks, %s — your Serva subscription is renewed.

                %s is active until %s.

                — Serva

                ------------------------------------------------------------

                شكراً %s — تم تجديد اشتراكك في Serva.

                %s نشط حتى %s.
                """.formatted(e.ownerName(), e.cafeName(), until, e.ownerName(), e.cafeName(), until);
        return new EmailMessage(e.ownerEmail(), "Your Serva subscription is renewed", null, text);
    }

    private EmailMessage adminAlertEmail(String adminTo, CafeSignedUpEvent e) {
        String text = """
                New café signup awaiting payment:

                  Café:      %s
                  Owner:     %s <%s>
                  Amount:    %s
                  Reference: %s

                Confirm it in the admin onboarding queue once the transfer arrives.
                """.formatted(e.cafeName(), e.ownerName(), e.ownerEmail(),
                formatAmount(e.amount(), e.currency()), e.reference());
        return new EmailMessage(adminTo, "New café signup: " + e.cafeName(), null, text);
    }

    // ----------------------------------------------------------------- helpers

    private String baseUrl() {
        String b = appProperties.publicBaseUrl();
        return (b != null && !b.isBlank()) ? b.replaceAll("/+$", "") : "";
    }

    private static String formatAmount(BigDecimal amount, String currency) {
        return (amount != null ? amount.toPlainString() : "0") + " " + (currency != null ? currency : "OMR");
    }

    private static String bank(AppProperties.Onboarding o) { return o != null ? o.bankName() : ""; }
    private static String accName(AppProperties.Onboarding o) { return o != null ? o.accountName() : ""; }
    private static String accNo(AppProperties.Onboarding o) { return o != null ? o.accountNumber() : ""; }
    private static String iban(AppProperties.Onboarding o) { return o != null ? o.iban() : ""; }
}
