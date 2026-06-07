package com.cafeqr.notifications.sms;

import com.cafeqr.common.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends SMS via Infobip ({@code POST {base}/sms/2/text/advanced}). Infobip has local Gulf routes,
 * so Oman (+968) delivery is cheaper/more reliable than global A2P. When not configured
 * ({@code app.notifications.sms.provider != infobip} or no credentials) it only logs, so order
 * flows work without external setup.
 */
@Component
public class InfobipSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger("notifications.sms");

    private final AppProperties.Notifications notifications;
    private final RestClient restClient;

    public InfobipSmsSender(AppProperties appProperties) {
        this.notifications = appProperties.notifications();
        this.restClient = RestClient.create();
    }

    @Override
    public void send(String toPhone, String message) {
        AppProperties.Notifications.Sms cfg = notifications != null ? notifications.sms() : null;
        AppProperties.Notifications.Infobip infobip = notifications != null ? notifications.infobip() : null;
        if (cfg == null || !cfg.enabled(infobip)) {
            log.info("[SMS:log] to={} :: {}", toPhone, message);
            return;
        }
        try {
            String destination = toInternational(toPhone, cfg.defaultCountryCodeOrDefault());
            Map<String, Object> body = Map.of(
                    "messages", List.of(Map.of(
                            "from", cfg.from(),
                            "destinations", List.of(Map.of("to", destination)),
                            "text", message)));

            restClient.post()
                    .uri(infobip.httpBase() + "/sms/2/text/advanced")
                    .header("Authorization", "App " + infobip.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[SMS:infobip] sent to={}", destination);
        } catch (Exception e) {
            // Never break the order flow because an SMS failed.
            log.error("[SMS:infobip] failed to={}: {}", toPhone, e.getMessage());
        }
    }

    /** Turns a local Omani number (e.g. "99887766") into E.164 digits ("96899887766"). */
    static String toInternational(String phone, String countryCode) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("00")) {
            digits = digits.substring(2);
        }
        // Local 8-digit Oman mobile (starts 7/9) → prepend country code.
        if (digits.length() == 8 && (digits.startsWith("9") || digits.startsWith("7"))) {
            return countryCode + digits;
        }
        return digits;
    }
}
