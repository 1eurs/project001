package com.cafeqr.users.repository;

import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRole(Role role);

    List<User> findByRestaurantIdOrderByIdAsc(Long restaurantId);

    List<User> findByBranchIdOrderByIdAsc(Long branchId);
}
