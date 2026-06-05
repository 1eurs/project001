package com.cafeqr.menus.dto;

import com.cafeqr.branches.domain.Branch;
import com.cafeqr.menus.domain.MenuCategory;
import com.cafeqr.menus.domain.MenuItem;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.tables.domain.RestaurantTable;

import java.math.BigDecimal;
import java.util.List;

/** Bilingual public menu payload served to customers after scanning a QR code. */
public record PublicMenuResponse(
        PublicRestaurant restaurant,
        PublicBranch branch,
        PublicTable table,
        List<PublicCategory> categories
) {

    public record PublicRestaurant(
            Long id,
            String name,
            String slug,
            String logoUrl,
            String phone,
            String instagramUrl,
            String currency,
            boolean vatEnabled,
            BigDecimal vatRate
    ) {
        public static PublicRestaurant from(Restaurant r) {
            return new PublicRestaurant(r.getId(), r.getName(), r.getSlug(), r.getLogoUrl(),
                    r.getPhone(), r.getInstagramUrl(), r.getCurrency(), r.isVatEnabled(), r.getVatRate());
        }
    }

    public record PublicBranch(
            Long id,
            String name,
            String address,
            String phone,
            String openingHours
    ) {
        public static PublicBranch from(Branch b) {
            if (b == null) {
                return null;
            }
            return new PublicBranch(b.getId(), b.getName(), b.getAddress(), b.getPhone(), b.getOpeningHours());
        }
    }

    public record PublicTable(
            Long id,
            String tableNumber,
            String qrCodeToken
    ) {
        public static PublicTable from(RestaurantTable t) {
            if (t == null) {
                return null;
            }
            return new PublicTable(t.getId(), t.getTableNumber(), t.getQrCodeToken());
        }
    }

    public record PublicCategory(
            Long id,
            String nameEn,
            String nameAr,
            String descriptionEn,
            String descriptionAr,
            int displayOrder,
            List<PublicItem> items
    ) {
        public static PublicCategory of(MenuCategory c, List<PublicItem> items) {
            return new PublicCategory(c.getId(), c.getNameEn(), c.getNameAr(),
                    c.getDescriptionEn(), c.getDescriptionAr(), c.getDisplayOrder(), items);
        }
    }

    public record PublicItem(
            Long id,
            String nameEn,
            String nameAr,
            String descriptionEn,
            String descriptionAr,
            BigDecimal price,
            String imageUrl,
            boolean available,
            Integer preparationTimeMinutes,
            int displayOrder
    ) {
        public static PublicItem from(MenuItem i) {
            return new PublicItem(i.getId(), i.getNameEn(), i.getNameAr(),
                    i.getDescriptionEn(), i.getDescriptionAr(), i.getPrice(), i.getImageUrl(),
                    i.isAvailable(), i.getPreparationTimeMinutes(), i.getDisplayOrder());
        }
    }
}
