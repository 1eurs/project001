package com.cafeqr.otp;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.util.Phones;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger("otp");
    private static final SecureRandom RNG = new SecureRandom();
    private static final String GRAPH_API = "https://graph.facebook.com/v20.0";
    private static final String TOKEN_TYPE = "phone_verify";
    private static final long TOKEN_TTL_DAYS = 30;

    private final OtpStore store;
    private final AppProperties.Notifications.Whatsapp waCfg;
    private final SecretKey signingKey;
    private final RestClient restClient;

    public OtpService(OtpStore store, AppProperties appProperties) {
        this.store = store;
        this.waCfg = appProperties.notifications() != null
                ? appProperties.notifications().whatsapp() : null;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(appProperties.jwt().secret()));
        this.restClient = RestClient.create();
    }

    /**
     * Generates a 6-digit OTP for the given raw phone and sends it via WhatsApp Cloud API.
     * Falls back to log-only when credentials are not configured.
     */
    public void send(String rawPhone) {
        String phone = Phones.normalize(rawPhone);
        if (phone == null) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR, "Invalid phone number");
        }

        String code = generateCode();
        store.put(phone, code);

        if (waCfg == null || !waCfg.configured()) {
            log.info("[OTP:log] phone={} code={}", phone, code);
            return;
        }

        String to = toE164Digits(phone);
        String url = GRAPH_API + "/" + waCfg.phoneNumberId() + "/messages";
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", to,
                "type", "text",
                "text", Map.of(
                        "preview_url", false,
                        "body", "Your CafeQR verification code is: " + code
                                + "\n\nValid for 5 minutes. Do not share this code."
                )
        );

        try {
            restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + waCfg.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[OTP:whatsapp] sent to={}", to);
        } catch (Exception e) {
            log.error("[OTP:whatsapp] send failed to={}: {}", to, e.getMessage());
            store.put(phone, "");
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Could not send OTP — please try again.");
        }
    }

    /**
     * Verifies the OTP code for the given raw phone.
     * On success, returns a signed 30-day phone-verification JWT.
     * Throws {@link BadRequestException} on wrong / expired code.
     */
    public String verifyAndIssueToken(String rawPhone, String code) {
        String phone = Phones.normalize(rawPhone);
        if (phone == null || !store.verify(phone, code)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Invalid or expired OTP. Please request a new code.");
        }
        return issuePhoneToken(phone);
    }

    /**
     * Validates a phone-verification token issued by this service.
     * Returns {@code true} when the token is valid and belongs to the given normalized phone.
     */
    /** Reads the pending OTP from the in-memory store (integration tests / local debugging). */
    public String pendingCode(String rawPhone) {
        String phone = Phones.normalize(rawPhone);
        return phone == null ? null : store.peek(phone);
    }

    public boolean isPhoneTokenValid(String normalizedPhone, String token) {
        if (token == null || token.isBlank()) return false;
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return TOKEN_TYPE.equals(claims.get("typ", String.class))
                    && normalizedPhone.equals(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private String issuePhoneToken(String normalizedPhone) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(normalizedPhone)
                .claim("typ", TOKEN_TYPE)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(TOKEN_TTL_DAYS, ChronoUnit.DAYS)))
                .signWith(signingKey)
                .compact();
    }

    private static String generateCode() {
        return String.format("%06d", RNG.nextInt(1_000_000));
    }

    static String toE164Digits(String normalizedPhone) {
        return normalizedPhone.startsWith("+") ? normalizedPhone.substring(1) : normalizedPhone;
    }
}
