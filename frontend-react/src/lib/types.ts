// TypeScript mirrors of the backend DTOs (only the fields the UI uses).

export type Lang = 'ar' | 'en';

export type Permission =
  | 'PLATFORM_ADMIN' | 'ORDERS' | 'PAYMENTS' | 'MENU'
  | 'QR_TABLES' | 'TEAM' | 'ANALYTICS' | 'PROFILE' | 'BRANCHES' | 'BILLING';
export type OrderType = 'DINE_IN' | 'CAR';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'OTHER';
export type SubscriptionStatus = 'PENDING_PAYMENT' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
export type SubscriptionPaymentMethod = 'BANK_TRANSFER';

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  permissions: Permission[];
  owner: boolean;
  restaurantId?: number | null;
  branchId?: number | null;
  active: boolean;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserResponse;
}

/* ---- public menu (App A) ---- */
export interface PublicRestaurant {
  id: number; name: string; slug: string; logoUrl?: string | null; phone?: string | null;
  instagramUrl?: string | null; currency: string; vatEnabled: boolean; vatRate: number; // percent (5 = 5%)
  theme?: string | null; // menu look chosen by the café owner (see menuThemes.ts); optional
  themeCustomJson?: string | null;
}
export interface PublicBranch { id: number; name: string; address?: string | null; phone?: string | null; openingHours?: string | null; }
export interface PublicTable { id: number; tableNumber: string; qrCodeToken: string; }
export interface PublicOption {
  id: number; nameEn: string; nameAr: string; priceDelta: number; displayOrder: number;
}
export interface PublicOptionGroup {
  id: number; nameEn: string; nameAr: string; selectionType: 'SINGLE' | 'MULTI';
  required: boolean; displayOrder: number; options: PublicOption[];
}
export interface PublicItem {
  id: number; nameEn: string; nameAr: string; descriptionEn?: string | null; descriptionAr?: string | null;
  price: number; salePrice?: number | null; // discounted base price when a discount is currently active
  imageUrl?: string | null; images?: string[] | null; available: boolean;
  preparationTimeMinutes?: number | null; displayOrder: number; optionGroups?: PublicOptionGroup[];
}
export interface PublicCategory {
  id: number; nameEn: string; nameAr: string; descriptionEn?: string | null; descriptionAr?: string | null;
  displayOrder: number; items: PublicItem[];
}
export interface PublicMenu {
  restaurant: PublicRestaurant; branch?: PublicBranch | null; table?: PublicTable | null; categories: PublicCategory[];
}

/* ---- orders ---- */
export interface OrderItem {
  id?: number; menuItemId?: number; nameEn: string; nameAr: string; quantity: number;
  price: number; lineTotal: number; note?: string | null;
}
export interface OrderTracking {
  orderNumber: string; trackingToken: string; orderType: OrderType; status: OrderStatus; paymentStatus: PaymentStatus;
  subtotal: number; vatAmount: number; total: number; prepTimeMinutes?: number | null; declineReason?: string | null;
  customerName?: string | null; carPlate?: string | null; carColor?: string | null; customerNote?: string | null; items: OrderItem[];
  createdAt: string; acceptedAt?: string | null; preparingAt?: string | null; readyAt?: string | null;
  completedAt?: string | null; cancelledAt?: string | null; declinedAt?: string | null;
}
// full dashboard order (live board / detail) — mirrors OrderResponse.java
export interface OrderResponse {
  id: number; orderNumber: string; trackingToken: string; restaurantId: number; branchId: number; tableId?: number | null;
  customerName?: string | null; customerPhone?: string | null; carPlate?: string | null; carColor?: string | null; orderType: OrderType; status: OrderStatus; paymentStatus: PaymentStatus;
  subtotal: number; vatAmount: number; total: number; prepTimeMinutes?: number | null; declineReason?: string | null;
  customerNote?: string | null; internalNote?: string | null; paymentMethod?: PaymentMethod | null; items: OrderItem[];
  createdAt: string; acceptedAt?: string | null; declinedAt?: string | null; preparingAt?: string | null;
  readyAt?: string | null; completedAt?: string | null; cancelledAt?: string | null;
}

export interface BranchResponse {
  id: number; restaurantId: number; name: string; address?: string | null; phone?: string | null;
  openingHours?: string | null; active: boolean; createdAt?: string;
}
export interface TableResponse {
  id: number; restaurantId: number; branchId: number; tableNumber: string; qrCodeToken: string;
  qrCodeUrl?: string | null; active: boolean;
}

export interface OrderSummaryResponse {
  id: number; orderNumber: string; branchId?: number | null; tableId?: number | null; customerName?: string | null;
  carPlate?: string | null; carColor?: string | null; orderType: OrderType; status: OrderStatus; paymentStatus: PaymentStatus; total: number; prepTimeMinutes?: number | null; createdAt: string;
}
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean; }

/* ---- menu management ---- */
export interface CategoryResponse {
  id: number; restaurantId: number; branchId?: number | null; nameEn: string; nameAr: string;
  descriptionEn?: string | null; descriptionAr?: string | null; displayOrder: number; active: boolean;
}
export interface MenuItemOptionRow { id?: number; nameEn: string; nameAr: string; priceDelta: number; displayOrder: number; }
export interface MenuItemOptionGroupRow {
  id?: number; nameEn: string; nameAr: string; selectionType: 'SINGLE' | 'MULTI'; required: boolean;
  displayOrder: number; options: MenuItemOptionRow[];
}
export type DiscountType = 'PERCENT' | 'FIXED';
export interface MenuItemResponse {
  id: number; restaurantId: number; branchId?: number | null; categoryId: number; nameEn: string; nameAr: string;
  descriptionEn?: string | null; descriptionAr?: string | null; price: number; imageUrl?: string | null;
  // Optional discount: PERCENT (value = % off) or FIXED (value = sale price); window optional.
  discountType?: DiscountType | null; discountValue?: number | null;
  discountStartsAt?: string | null; discountEndsAt?: string | null;
  images?: string[] | null; available: boolean; preparationTimeMinutes?: number | null; displayOrder: number;
  optionGroups?: MenuItemOptionGroupRow[] | null;
}

export interface SelectedOption { optionGroupId: number; optionId: number; }
export interface CreateOrderItem {
  menuItemId: number; quantity: number; note?: string | null;
  selectedOptions?: SelectedOption[] | null;
}
export interface CreateOrderPayload {
  restaurantSlug: string; branchId: number; tableToken?: string | null; orderType: OrderType;
  customerName?: string | null; customerPhone?: string | null; carPlate?: string | null; carColor?: string | null; customerNote?: string | null;
  deviceToken?: string | null; phoneToken?: string | null; items: CreateOrderItem[];
}
// Manual order taken by staff from the dashboard order pad — mirrors CreateStaffOrderRequest.java.
export interface CreateStaffOrderPayload {
  branchId: number; orderType: OrderType; tableId?: number | null;
  customerName?: string | null; customerPhone?: string | null;
  carPlate?: string | null; carColor?: string | null; customerNote?: string | null;
  items: CreateOrderItem[];
}

/* ---- returning customer (public) ---- */
export interface FavoriteItem { menuItemId: number; nameEn: string; nameAr: string; totalQuantity: number; ordersContaining: number; }
export interface LastOrderItem { menuItemId: number; nameEn: string; nameAr: string; quantity: number; }
export interface ReturningCustomer {
  customerName?: string | null; customerPhone?: string | null; carPlate?: string | null; carColor?: string | null;
  orderCount: number; favorites: FavoriteItem[];
  lastOrder?: { createdAt: string; items: LastOrderItem[] } | null;
}

/* ---- platform admin: per-restaurant stats ---- */
export interface AdminRestaurantStats {
  restaurantId: number; ordersToday: number; orders30d: number; revenue30d: number;
  ordersTotal: number; lastOrderAt?: string | null; branches: number; menuItems: number;
}

/* ---- blocked phones (dashboard) ---- */
export interface BlockedPhone { id: number; phone: string; reason?: string | null; blockedBy?: string | null; createdAt: string; }

/* ---- admin ---- */
export type Plan = 'STANDARD' | 'PRO' | 'ENTERPRISE';

/** Pricing for one café tier (admin Plans page). monthlyPrice null = "custom". */
export interface PricingPlan {
  id: number; tier: Plan; name: string; monthlyPrice: number | null; setupFee: number;
  active: boolean; displayOrder: number; createdAt?: string; updatedAt?: string;
}
export interface Restaurant {
  id: number; name: string; slug: string; logoUrl?: string | null; phone?: string | null; email?: string | null; instagramUrl?: string | null;
  currency: string; vatEnabled: boolean; vatRate: number; theme?: string | null; themeCustomJson?: string | null;
  active: boolean; premiumLook?: boolean; plan?: Plan; createdAt?: string;
}
export type BillingCycle = 'ONE_TIME' | 'MONTHLY' | 'YEARLY';
export interface Subscription {
  id: number; restaurantId: number; planName: string; billingCycle: BillingCycle; price: number;
  status: SubscriptionStatus; startDate?: string | null; endDate?: string | null; currentlyActive?: boolean;
  paymentMethod?: SubscriptionPaymentMethod | null; paymentReference?: string | null; paymentConfirmedAt?: string | null;
}

/* ---- live QR activity (dashboard Tables tab) ---- */
export interface QrLive { present: number; ordering: number; } // present includes ordering
export interface QrDayStat { orders: number; revenue: number; }
export interface QrCartItem { menuItemId: number; nameEn: string; nameAr: string; quantity: number; }
export interface QrActivity {
  totalPresent: number;
  totalOrdering: number;
  liveByKey: Record<string, QrLive>;        // keyed by table qrCodeToken / "car"
  cartsByKey?: Record<string, QrCartItem[]>; // live cart contents (same keys) — soft signal
  todayByKey: Record<string, QrDayStat>;    // keyed by table id (string) / "car"
}

/* ---- branch management (admin drawer) ---- */
export interface BranchResponse {
  id: number; restaurantId: number; name: string; address?: string | null; phone?: string | null;
  openingHours?: string | null; active: boolean; createdAt?: string;
}
