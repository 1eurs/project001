package com.cafeqr.auth.security;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.users.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/** Issues and verifies stateless JWT access tokens. */
@Service
public class JwtService {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_RESTAURANT_ID = "rid";
    private static final String CLAIM_BRANCH_ID = "bid";
    private static final String CLAIM_TYPE = "typ";
    private static final String TYPE_ACCESS = "access";

    private final SecretKey key;
    private final String issuer;
    private final long accessTtlMinutes;

    public JwtService(AppProperties properties) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()));
        this.issuer = properties.jwt().issuer();
        this.accessTtlMinutes = properties.jwt().accessTokenTtlMinutes();
    }

    public String generateAccessToken(CustomUserDetails user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTtlMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
                .issuer(issuer)
                .subject(String.valueOf(user.getUserId()))
                .claim(CLAIM_EMAIL, user.getUsername())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_RESTAURANT_ID, user.getRestaurantId())
                .claim(CLAIM_BRANCH_ID, user.getBranchId())
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public long getAccessTtlSeconds() {
        return accessTtlMinutes * 60;
    }

    /** Parses and verifies a token, returning the authenticated principal. Throws on any failure. */
    public CustomUserDetails parsePrincipal(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long userId = Long.valueOf(claims.getSubject());
        String email = claims.get(CLAIM_EMAIL, String.class);
        Role role = Role.valueOf(claims.get(CLAIM_ROLE, String.class));
        Long restaurantId = readLong(claims, CLAIM_RESTAURANT_ID);
        Long branchId = readLong(claims, CLAIM_BRANCH_ID);
        // Password hash is irrelevant for token-based auth; principal is built from claims.
        return new CustomUserDetails(userId, email, "N/A", role, restaurantId, branchId, true);
    }

    private static Long readLong(Claims claims, String name) {
        Object value = claims.get(name);
        if (value == null) {
            return null;
        }
        return ((Number) value).longValue();
    }
}
