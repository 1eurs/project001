package com.cafeqr.auth.security;

import com.cafeqr.users.domain.Permission;
import com.cafeqr.users.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;

/** Authenticated principal carrying tenant scoping used for data isolation. */
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String passwordHash;
    private final Set<Permission> permissions;
    private final boolean owner;
    private final Long restaurantId;
    private final Long branchId;
    private final boolean active;

    public CustomUserDetails(Long userId, String username, String passwordHash,
                             Set<Permission> permissions, boolean owner,
                             Long restaurantId, Long branchId, boolean active) {
        this.userId = userId;
        this.username = username;
        this.passwordHash = passwordHash;
        this.permissions = (permissions == null || permissions.isEmpty())
                ? EnumSet.noneOf(Permission.class)
                : EnumSet.copyOf(permissions);
        this.owner = owner;
        this.restaurantId = restaurantId;
        this.branchId = branchId;
        this.active = active;
    }

    public static CustomUserDetails from(User user) {
        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getPermissions(),
                user.isOwner(),
                user.getRestaurantId(),
                user.getBranchId(),
                user.isActive());
    }

    public Long getUserId() {
        return userId;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public boolean hasPermission(Permission permission) {
        return permissions.contains(permission);
    }

    public boolean isOwner() {
        return owner;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public boolean isPlatformAdmin() {
        return permissions.contains(Permission.PLATFORM_ADMIN);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permissions.stream()
                .map(p -> (GrantedAuthority) new SimpleGrantedAuthority(p.name()))
                .toList();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
