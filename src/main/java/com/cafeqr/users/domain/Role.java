package com.cafeqr.users.domain;

/** Platform roles. Spring Security authorities are derived as {@code ROLE_<name>}. */
public enum Role {
    PLATFORM_ADMIN,
    RESTAURANT_OWNER,
    BRANCH_MANAGER,
    STAFF,
    KITCHEN_STAFF
}
