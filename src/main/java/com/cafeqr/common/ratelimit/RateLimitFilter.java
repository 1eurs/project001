package com.cafeqr.common.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Rejects abusive bursts on sensitive public endpoints with 429. Keyed by client IP
 * (X-Forwarded-For first hop, since the app sits behind nginx). Not a Spring bean — it's wired
 * into the security chain by {@code SecurityConfig} so registration + ordering are explicit.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> AUTH_PATHS = Set.of(
            "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh");
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/public/onboarding", "/api/public/leads");
    private static final int WINDOW_SECONDS = 60;

    private final RateLimiter limiter;
    private final boolean enabled;
    private final int authPerMinute;
    private final int publicPerMinute;

    public RateLimitFilter(RateLimiter limiter, boolean enabled, int authPerMinute, int publicPerMinute) {
        this.limiter = limiter;
        this.enabled = enabled;
        this.authPerMinute = authPerMinute;
        this.publicPerMinute = publicPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (enabled && "POST".equalsIgnoreCase(request.getMethod())) {
            String path = request.getRequestURI();
            // Note: keep these as separate ifs — a mixed int/Integer ternary would unbox null → NPE.
            Integer limit = null;
            String bucket = null;
            if (AUTH_PATHS.contains(path)) {
                limit = authPerMinute;
                bucket = "auth";
            } else if (PUBLIC_PATHS.contains(path)) {
                limit = publicPerMinute;
                bucket = "public";
            }
            if (limit != null) {
                String key = bucket + ':' + clientIp(request);
                if (!limiter.allow(key, limit, WINDOW_SECONDS)) {
                    reject(response);
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
        response.getWriter().write(
                "{\"success\":false,\"message\":\"Too many requests - please slow down and try again shortly.\","
                        + "\"errorCode\":\"RATE_LIMITED\"}");
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }
}
