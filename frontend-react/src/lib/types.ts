// TypeScript mirrors of the backend DTOs (only the fields the UI uses).

export type Lang = 'ar' | 'en';

export type Role = 'PLATFORM_ADMIN' | 'RESTAURANT_OWNER' | 'BRANCH_MANAGER' | 'STAFF' | 'KITCHEN_STAFF';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'CAR';
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
  email: string;
  role: Role;
  restaurantId?: number | null;
  branchId?: number | null;
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
export interface PublicItem {
  id: number; nameEn: string; nameAr: string; descriptionEn?: string | null; descriptionAr?: string | null;
  price: number; imageUrl?: string | null; available: boolean; preparationTimeMinutes?: number | null; displayOrder: number;
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
export interface MenuItemResponse {
  id: number; restaurantId: number; branchId?: number | null; categoryId: number; nameEn: string; nameAr: string;
  descriptionEn?: string | null; descriptionAr?: string | null; price: number; imageUrl?: string | null;
  available: boolean; preparationTimeMinutes?: number | null; displayOrder: number;
}

export interface CreateOrderItem { menuItemId: number; quantity: number; note?: string | null; }
export interface CreateOrderPayload {
  restaurantSlug: string; branchId: number; tableToken?: string | null; orderType: OrderType;
  customerName?: string | null; customerPhone?: string | null; carPlate?: string | null; carColor?: string | null; customerNote?: string | null;
  deviceToken?: string | null; items: CreateOrderItem[];
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
export interface Restaurant {
  id: number; name: string; slug: string; logoUrl?: string | null; phone?: string | null; email?: string | null; instagramUrl?: string | null;
  currency: string; vatEnabled: boolean; vatRate: number; theme?: string | null; themeCustomJson?: string | null; active: boolean; createdAt?: string;
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
  liveByKey: Record<string, QrLive>;        // keyed by table qrCodeToken / "car" / "takeaway"
  cartsByKey?: Record<string, QrCartItem[]>; // live cart contents (same keys) — soft signal
  todayByKey: Record<string, QrDayStat>;    // keyed by table id (string) / "car" / "takeaway"
}

/* ---- self-serve onboarding ---- */
// Bank-transfer instructions returned after a public signup (POST /api/public/onboarding).
export interface OnboardingInstructions {
  slug: string; reference: string; amount: number; currency: string;
  bankName: string; accountName: string; accountNumber: string; iban: string;
}
// A café awaiting payment confirmation, in the admin queue (GET /api/admin/onboarding).
export interface PendingOnboarding {
  restaurantId: number; cafeName: string; slug: string;
  ownerName?: string | null; ownerEmail?: string | null; phone?: string | null;
  amount: number; reference: string; createdAt: string;
}
