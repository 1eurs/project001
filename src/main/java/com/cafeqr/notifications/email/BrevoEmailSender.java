package com.cafeqr.notifications.email;

import com.cafeqr.common.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Sends email via Brevo's transactional API ({@code POST https://api.brevo.com/v3/smtp/email}).
 * When Brevo isn't configured ({@code app.notifications.email.provider != brevo} or no key) it only
 * logs, so the app runs end-to-end without external setup. Brevo's free tier covers our volume.
 */
@Component
public class BrevoEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger("notifications.email");
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    private static final Pattern NAMED = Pattern.compile("^\\s*(.*?)\\s*<\\s*(.+?)\\s*>\\s*$");

    private final AppProperties.Notifications.Email config;
    private final RestClient restClient;

    public BrevoEmailSender(AppProperties appProperties) {
        this.config = appProperties.notifications() != null ? appProperties.notifications().email() : null;
        this.restClient = RestClient.create();
    }

    @Override
    public void send(EmailMessage message) {
        if (config == null || !config.brevoEnabled()) {
            log.info("[EMAIL:log] to={} subject=\"{}\"", message.to(), message.subject());
            return;
        }
        try {
            String[] sender = parseSender(config.from());
            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of("name", sender[0], "email", sender[1]));
            body.put("to", List.of(Map.of("email", message.to())));
            body.put("subject", message.subject());
            if (message.text() != null) {
                body.put("textContent", message.text());
            }
            if (message.html() != null) {
                body.put("htmlContent", message.html());
            }

            restClient.post()
                    .uri(BREVO_URL)
                    .header("api-key", config.brevoApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[EMAIL:brevo] sent to={} subject=\"{}\"", message.to(), message.subject());
        } catch (Exception e) {
            // Never break the caller's flow because an email failed.
            log.error("[EMAIL:brevo] failed to={} subject=\"{}\": {}", message.to(), message.subject(), e.getMessage());
        }
    }

    /** Parses {@code "Name <email>"} (or a bare {@code "email"}) into {@code [name, email]}. */
    static String[] parseSender(String from) {
        if (from == null || from.isBlank()) {
            return new String[]{"Serva", "no-reply@example.com"};
        }
        Matcher m = NAMED.matcher(from);
        if (m.matches()) {
            String name = m.group(1).isBlank() ? "Serva" : m.group(1);
            return new String[]{name, m.group(2)};
        }
        return new String[]{"Serva", from.trim()};
    }
}
