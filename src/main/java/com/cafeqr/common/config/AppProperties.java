package com.cafeqr.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.List;

/** Type-safe binding of the {@code app.*} configuration tree. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Storage storage,
        String publicBaseUrl,
        Cors cors,
        Bootstrap bootstrap,
        Onboarding onboarding,
        Subscription subscription,
        Notifications notifications,
        RateLimit rateLimit
) {

    /** Per-IP request limits on sensitive public endpoints (in-memory, fixed 1-minute window). */
    public record RateLimit(
            Boolean enabled,
            Integer authPerMinute,    // /api/auth/login, forgot/reset/refresh
            Integer publicPerMinute   // /api/public/onboarding, /api/public/leads
    ) {
        public boolean enabledOrDefault() {
            return enabled == null || enabled;
        }

        public int authPerMinuteOrDefault() {
            return authPerMinute != null && authPerMinute > 0 ? authPerMinute : 10;
        }

        public int publicPerMinuteOrDefault() {
            return publicPerMinute != null && publicPerMinute > 0 ? publicPerMinute : 8;
        }
    }

    public record Jwt(
            String secret,
            long accessTokenTtlMinutes,
            long refreshTokenTtlDays,
            String issuer
    ) {}

    public record Storage(
            String type,
            String localDir
    ) {}

    public record Cors(
            List<String> allowedOrigins
    ) {}

    public record Bootstrap(
            boolean enabled,
            String adminEmail,
            String adminPassword,
            String adminFullName
    ) {}

    /**
     * Self-serve onboarding: the one-time fee a café pays the platform and the bank
     * details shown to them for the transfer. The single source of truth for both the
     * amount charged and the payment instructions returned by {@code /api/public/onboarding}.
     */
    public record Onboarding(
            String planName,
            BigDecimal price,
            String currency,
            String bankName,
            String accountName,
            String accountNumber,
            String iban
    ) {}

    /**
     * Subscription lifecycle for the annual model: how long a paid term lasts, the grace window
     * after it lapses before the café goes offline, and when to email renewal reminders.
     */
    public record Subscription(
            Integer termMonths,         // length of a paid term (default 12)
            Integer graceDays,          // days past end-date the café stays live before going offline
            List<Integer> reminderDaysBefore // days-before-expiry to email a renewal reminder
    ) {
        public int termMonthsOrDefault() {
            return termMonths != null && termMonths > 0 ? termMonths : 12;
        }

        public int graceDaysOrDefault() {
            return graceDays != null && graceDays >= 0 ? graceDays : 7;
        }

        public List<Integer> reminderDaysBeforeOrDefault() {
            return reminderDaysBefore != null && !reminderDaysBefore.isEmpty()
                    ? reminderDaysBefore : List.of(14, 7, 1);
        }
    }

    /**
     * Outbound channels: transactional email via Brevo (free tier) and customer order SMS via
     * Infobip (kept ready for a future, owner-activated paid feature). Each channel defaults to
     * {@code provider: log} (nothing sent — delivery only logged) until its provider + credentials
     * are set, so the app runs with zero external setup.
     */
    public record Notifications(
            Email email,
            Sms sms,
            Infobip infobip
    ) {
        /** Infobip account credentials (used by the SMS channel). */
        public record Infobip(
                String baseUrl,         // e.g. "xxxxx.api.infobip.com" (no scheme needed)
                String apiKey
        ) {
            public boolean configured() {
                return baseUrl != null && !baseUrl.isBlank() && apiKey != null && !apiKey.isBlank();
            }

            /** Normalises to a scheme-qualified base with no trailing slash. */
            public String httpBase() {
                String b = baseUrl == null ? "" : baseUrl.trim().replaceAll("/+$", "");
                return b.startsWith("http") ? b : "https://" + b;
            }
        }

        /** Transactional email (onboarding instructions, activation, admin alerts) via Brevo. */
        public record Email(
                String provider,        // "brevo" to enable; anything else = log only
                String brevoApiKey,
                String from,            // e.g. "Serva <onboarding@yourdomain.com>"
                String adminAlertTo     // where new-signup alerts go (optional)
        ) {
            public boolean brevoEnabled() {
                return "brevo".equalsIgnoreCase(provider) && brevoApiKey != null && !brevoApiKey.isBlank();
            }
        }

        /** Customer order SMS via Infobip. Deferred paid feature — integration kept ready. */
        public record Sms(
                String provider,        // "infobip" to enable; anything else = log only
                String from,            // alphanumeric sender id (or number)
                String defaultCountryCode // prepended to local numbers, e.g. "968" for Oman
        ) {
            public boolean enabled(Infobip infobip) {
                return "infobip".equalsIgnoreCase(provider) && infobip != null && infobip.configured();
            }

            public String defaultCountryCodeOrDefault() {
                return defaultCountryCode != null && !defaultCountryCode.isBlank() ? defaultCountryCode : "968";
            }
        }
    }
}
