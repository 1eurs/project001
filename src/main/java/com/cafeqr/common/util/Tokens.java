package com.cafeqr.common.util;

import java.security.SecureRandom;
import java.util.Base64;

/** Generates unguessable, URL-safe opaque tokens (QR tokens, tracking tokens, refresh tokens). */
public final class Tokens {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private Tokens() {
    }

    /** Default 32-byte token (~43 url-safe chars). */
    public static String random() {
        return random(32);
    }

    public static String random(int numBytes) {
        byte[] bytes = new byte[numBytes];
        RANDOM.nextBytes(bytes);
        return ENCODER.encodeToString(bytes);
    }
}
