package com.cafeqr.common.util;

/** Canonicalizes customer phone numbers so matching (favorites, blocklist) is format-insensitive. */
public final class Phones {

    private Phones() {
    }

    /**
     * Keeps digits (converting Arabic-Indic numerals) and a leading {@code +};
     * drops spaces, dashes and everything else. Returns {@code null} when nothing usable remains.
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(raw.length());
        for (char c : raw.toCharArray()) {
            if (c >= '٠' && c <= '٩') {
                sb.append((char) ('0' + (c - '٠')));
            } else if (c >= '۰' && c <= '۹') {
                sb.append((char) ('0' + (c - '۰')));
            } else if (c >= '0' && c <= '9') {
                sb.append(c);
            } else if (c == '+' && sb.isEmpty()) {
                sb.append(c);
            }
        }
        return sb.isEmpty() ? null : sb.toString();
    }
}
