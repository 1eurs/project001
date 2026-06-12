package com.cafeqr.onboarding;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.notifications.email.EmailMessage;
import com.cafeqr.notifications.email.EmailSender;
import com.cafeqr.notifications.email.EmailTemplate;
import com.cafeqr.onboarding.event.CafeActivatedEvent;
import com.cafeqr.onboarding.event.CafeRenewedEvent;
import com.cafeqr.onboarding.event.CafeSignedUpEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;

@Component
public class OnboardingMailListener {

    private final EmailSender email;
    private final AppProperties props;

    public OnboardingMailListener(EmailSender email, AppProperties props) {
        this.email = email;
        this.props = props;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSignedUp(CafeSignedUpEvent e) {
        email.send(signupEmail(e));

        String adminTo = adminAlertTo();
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

    // ------------------------------------------------------------------ emails

    private EmailMessage signupEmail(CafeSignedUpEvent e) {
        AppProperties.Onboarding o = props.onboarding();
        String amount = fmt(e.amount(), e.currency());

        String html = EmailTemplate.build()
            .line("Hi <strong>" + e.ownerName() + "</strong>,")
            .line("Welcome to Serva! To activate <strong>" + e.cafeName() + "</strong>, "
                + "please transfer <strong>" + amount + "</strong> using the bank details below. "
                + "Include your reference in the transfer note so we can match it.")
            .code("Your reference", e.reference())
            .kvTable(
                "Bank",           bank(o),
                "Account name",   accName(o),
                "Account number", accNo(o),
                "IBAN",           iban(o),
                "Amount",         amount
            )
            .muted("We'll activate your account within 1 business day of receiving the transfer. "
                 + "You'll get a confirmation email and can sign in immediately.")
            .divider()
            .rtl()
            .line("مرحباً <strong>" + e.ownerName() + "</strong>،")
            .line("أهلاً بك في Serva! لتفعيل <strong>" + e.cafeName() + "</strong>، "
                + "حوّل <strong>" + amount + "</strong> إلى الحساب أدناه، "
                + "واكتب رمزك المرجعي في ملاحظة التحويل.")
            .code("رمزك المرجعي", e.reference())
            .kvTable(
                "البنك",       bank(o),
                "اسم الحساب",  accName(o),
                "رقم الحساب",  accNo(o),
                "الآيبان",     iban(o),
                "المبلغ",      amount
            )
            .muted("سنفعّل حسابك خلال يوم عمل واحد من استلام التحويل. "
                 + "ستصلك رسالة تأكيد ويمكنك تسجيل الدخول فوراً.")
            .html();

        String text = """
            Hi %s,

            Welcome to Serva! Transfer %s to activate %s.

            Reference: %s
            Bank: %s | Account: %s | IBAN: %s

            We'll activate within 1 business day.

            — Serva
            """.formatted(e.ownerName(), amount, e.cafeName(), e.reference(), bank(o), accNo(o), iban(o));

        return new EmailMessage(e.ownerEmail(),
            "Complete your Serva signup — bank transfer details", html, text);
    }

    private EmailMessage activatedEmail(CafeActivatedEvent e) {
        String url = baseUrl() + "/dashboard";

        String html = EmailTemplate.build()
            .line("Hi <strong>" + e.ownerName() + "</strong>,")
            .line("<strong>" + e.cafeName() + "</strong> is now live on Serva! 🎉 "
                + "Head to your dashboard to set up your menu and QR codes.")
            .button(url, "Open dashboard →")
            .muted("If the button doesn't work, copy this link: <a href=\"" + url
                 + "\" style=\"color:#10b981;\">" + url + "</a>")
            .divider()
            .rtl()
            .line("مرحباً <strong>" + e.ownerName() + "</strong>،")
            .line("<strong>" + e.cafeName() + "</strong> أصبح الآن نشطاً على Serva! 🎉 "
                + "افتح لوحتك لإعداد القائمة ورموز QR.")
            .button(url, "افتح اللوحة ←")
            .html();

        String text = """
            Hi %s, your café %s is now live! Sign in at %s

            — Serva
            """.formatted(e.ownerName(), e.cafeName(), url);

        return new EmailMessage(e.ownerEmail(), "Your Serva café is live 🎉", html, text);
    }

    private EmailMessage renewedEmail(CafeRenewedEvent e) {
        String until = e.activeUntil() != null ? e.activeUntil().toString() : "";

        String html = EmailTemplate.build()
            .line("Hi <strong>" + e.ownerName() + "</strong>,")
            .line("Your Serva subscription has been renewed. <strong>" + e.cafeName()
                + "</strong> is active until <strong>" + until + "</strong>.")
            .muted("You'll receive a reminder before your next renewal date. No action needed right now.")
            .divider()
            .rtl()
            .line("مرحباً <strong>" + e.ownerName() + "</strong>،")
            .line("تم تجديد اشتراكك في Serva. <strong>" + e.cafeName()
                + "</strong> نشط حتى <strong>" + until + "</strong>.")
            .muted("ستصلك رسالة تذكير قبل موعد التجديد القادم.")
            .html();

        String text = """
            Hi %s, your Serva subscription for %s has been renewed. Active until %s.

            — Serva
            """.formatted(e.ownerName(), e.cafeName(), until);

        return new EmailMessage(e.ownerEmail(), "Serva subscription renewed ✓", html, text);
    }

    private EmailMessage adminAlertEmail(String adminTo, CafeSignedUpEvent e) {
        String amount = fmt(e.amount(), e.currency());

        String html = EmailTemplate.build()
            .line("New café signup waiting for payment confirmation.")
            .kvTable(
                "Café",      e.cafeName(),
                "Owner",     e.ownerName(),
                "Email",     e.ownerEmail(),
                "Amount",    amount,
                "Reference", e.reference()
            )
            .muted("Confirm in the admin onboarding queue once the transfer arrives.")
            .html();

        String text = "New signup: %s (%s) — %s — ref %s"
            .formatted(e.cafeName(), e.ownerEmail(), amount, e.reference());

        return new EmailMessage(adminTo, "New café signup: " + e.cafeName(), html, text);
    }

    // ------------------------------------------------------------------ helpers

    private String baseUrl() {
        String b = props.publicBaseUrl();
        return (b != null && !b.isBlank()) ? b.replaceAll("/+$", "") : "https://serva.om";
    }

    private String adminAlertTo() {
        return props.notifications() != null && props.notifications().email() != null
            ? props.notifications().email().adminAlertTo() : null;
    }

    private static String fmt(BigDecimal amount, String currency) {
        return (amount != null ? amount.toPlainString() : "0")
            + " " + (currency != null ? currency : "OMR");
    }

    private static String bank(AppProperties.Onboarding o)    { return o != null ? o.bankName()      : ""; }
    private static String accName(AppProperties.Onboarding o) { return o != null ? o.accountName()   : ""; }
    private static String accNo(AppProperties.Onboarding o)   { return o != null ? o.accountNumber() : ""; }
    private static String iban(AppProperties.Onboarding o)    { return o != null ? o.iban()          : ""; }
}
