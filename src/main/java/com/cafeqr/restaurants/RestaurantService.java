package com.cafeqr.restaurants;

import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ConflictException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.util.Slugs;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.restaurants.dto.CreateRestaurantRequest;
import com.cafeqr.restaurants.dto.RestaurantResponse;
import com.cafeqr.restaurants.dto.UpdateRestaurantRequest;
import com.cafeqr.restaurants.repository.RestaurantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional
    public RestaurantResponse create(CreateRestaurantRequest request) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.name());
        restaurant.setSlug(resolveSlug(request.slug(), request.name()));
        restaurant.setLogoUrl(request.logoUrl());
        restaurant.setPhone(request.phone());
        restaurant.setEmail(request.email());
        restaurant.setInstagramUrl(request.instagramUrl());
        restaurant.setCurrency(request.currency() != null ? request.currency().toUpperCase() : "OMR");
        restaurant.setVatEnabled(request.vatEnabled() == null || request.vatEnabled());
        restaurant.setVatRate(request.vatRate() != null ? request.vatRate() : new BigDecimal("5"));
        restaurant.setActive(true);
        return RestaurantResponse.from(restaurantRepository.save(restaurant));
    }

    @Transactional(readOnly = true)
    public Page<RestaurantResponse> list(Boolean active, Pageable pageable) {
        Page<Restaurant> page = (active == null)
                ? restaurantRepository.findAll(pageable)
                : restaurantRepository.findByActive(active, pageable);
        return page.map(RestaurantResponse::from);
    }

    @Transactional(readOnly = true)
    public RestaurantResponse get(Long id) {
        return RestaurantResponse.from(getEntity(id));
    }

    @Transactional
    public RestaurantResponse update(Long id, UpdateRestaurantRequest request) {
        Restaurant restaurant = getEntity(id);
        if (request.name() != null) {
            restaurant.setName(request.name());
        }
        if (request.logoUrl() != null) {
            restaurant.setLogoUrl(request.logoUrl());
        }
        if (request.phone() != null) {
            restaurant.setPhone(request.phone());
        }
        if (request.email() != null) {
            restaurant.setEmail(request.email());
        }
        if (request.instagramUrl() != null) {
            restaurant.setInstagramUrl(request.instagramUrl());
        }
        if (request.currency() != null) {
            restaurant.setCurrency(request.currency().toUpperCase());
        }
        if (request.vatEnabled() != null) {
            restaurant.setVatEnabled(request.vatEnabled());
        }
        if (request.vatRate() != null) {
            restaurant.setVatRate(request.vatRate());
        }
        return RestaurantResponse.from(restaurant);
    }

    @Transactional
    public RestaurantResponse setActive(Long id, boolean active) {
        Restaurant restaurant = getEntity(id);
        restaurant.setActive(active);
        return RestaurantResponse.from(restaurant);
    }

    // ---- helpers shared with other modules ----

    @Transactional(readOnly = true)
    public Restaurant getEntity(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", id));
    }

    @Transactional(readOnly = true)
    public Restaurant getActiveBySlug(String slug) {
        Restaurant restaurant = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", slug));
        if (!restaurant.isActive()) {
            throw new BadRequestException(ErrorCode.RESTAURANT_INACTIVE, "Restaurant is not active");
        }
        return restaurant;
    }

    public void requireActive(Restaurant restaurant) {
        if (!restaurant.isActive()) {
            throw new BadRequestException(ErrorCode.RESTAURANT_INACTIVE, "Restaurant is not active");
        }
    }

    private String resolveSlug(String requestedSlug, String name) {
        String base = (requestedSlug != null && !requestedSlug.isBlank())
                ? Slugs.slugify(requestedSlug)
                : Slugs.slugify(name);
        if (base.isBlank()) {
            throw new BadRequestException("Unable to derive a slug; please provide one explicitly");
        }
        if (!restaurantRepository.existsBySlug(base)) {
            return base;
        }
        // Provided slug must be unique; auto-generated ones get a numeric suffix.
        if (requestedSlug != null && !requestedSlug.isBlank()) {
            throw new ConflictException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already in use: " + base);
        }
        int suffix = 2;
        String candidate = base + "-" + suffix;
        while (restaurantRepository.existsBySlug(candidate)) {
            suffix++;
            candidate = base + "-" + suffix;
        }
        return candidate;
    }
}
