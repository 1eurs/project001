package com.cafeqr.tables.repository;

import com.cafeqr.tables.domain.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable> findByBranchIdOrderByTableNumberAsc(Long branchId);

    Optional<RestaurantTable> findByQrCodeToken(String qrCodeToken);
}
