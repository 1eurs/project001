package com.cafeqr.orders;

import com.cafeqr.auth.security.AccessGuard;
import com.cafeqr.branches.BranchService;
import com.cafeqr.branches.domain.Branch;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import com.cafeqr.common.exception.ResourceNotFoundException;
import com.cafeqr.common.util.Tokens;
import com.cafeqr.menus.MenuService;
import com.cafeqr.menus.domain.MenuItem;
import com.cafeqr.orders.domain.Order;
import com.cafeqr.orders.domain.OrderItem;
import com.cafeqr.orders.domain.OrderStatus;
import com.cafeqr.orders.domain.OrderType;
import com.cafeqr.orders.dto.AcceptOrderRequest;
import com.cafeqr.orders.dto.CreateOrderRequest;
import com.cafeqr.orders.dto.OrderResponse;
import com.cafeqr.orders.dto.OrderSummaryResponse;
import com.cafeqr.orders.dto.OrderTrackingResponse;
import com.cafeqr.orders.realtime.OrderEvent;
import com.cafeqr.orders.realtime.OrderStreamService;
import com.cafeqr.orders.repository.OrderRepository;
import com.cafeqr.notifications.NotificationPayload;
import com.cafeqr.notifications.NotificationService;
import com.cafeqr.notifications.NotificationType;
import com.cafeqr.restaurants.RestaurantService;
import com.cafeqr.restaurants.domain.Restaurant;
import com.cafeqr.tables.domain.RestaurantTable;
import com.cafeqr.tables.TableService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class OrderService {

    private static final int MONEY_SCALE = 3;
    private static final List<OrderStatus> LIVE_STATUSES =
            List.of(OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY);

    private final OrderRepository orderRepository;
    private final RestaurantService restaurantService;
    private final BranchService branchService;
    private final TableService tableService;
    private final MenuService menuService;
    private final AccessGuard accessGuard;
    private final NotificationService notificationService;
    private final OrderStreamService streamService;

    public OrderService(OrderRepository orderRepository,
                        RestaurantService restaurantService,
                        BranchService branchService,
                        TableService tableService,
                        MenuService menuService,
                        AccessGuard accessGuard,
                        NotificationService notificationService,
                        OrderStreamService streamService) {
        this.orderRepository = orderRepository;
        this.restaurantService = restaurantService;
        this.branchService = branchService;
        this.tableService = tableService;
        this.menuService = menuService;
        this.accessGuard = accessGuard;
        this.notificationService = notificationService;
        this.streamService = streamService;
    }

    // ============================================================ customer (public)

    @Transactional
    public OrderTrackingResponse createOrder(CreateOrderRequest request) {
        Restaurant restaurant = restaurantService.getActiveBySlug(request.restaurantSlug());
        Branch branch = branchService.getEntityInRestaurant(restaurant.getId(), request.branchId());
        branchService.requireActive(branch);

        Long tableId = resolveTable(restaurant, branch, request);

        Order order = new Order();
        order.setRestaurantId(restaurant.getId());
        order.setBranchId(branch.getId());
        order.setTableId(tableId);
        order.setCustomerName(request.customerName());
        order.setCustomerPhone(request.customerPhone());
        order.setCustomerNote(request.customerNote());
        order.setOrderType(request.orderType());
        order.setStatus(OrderStatus.PENDING);

        BigDecimal subtotal = BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        for (CreateOrderRequest.Item line : request.items()) {
            MenuItem menuItem = menuService.getOrderableItem(restaurant.getId(), branch.getId(), line.menuItemId());
            BigDecimal lineTotal = menuItem.getPrice()
                    .multiply(BigDecimal.valueOf(line.quantity()))
                    .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItemId(menuItem.getId());
            orderItem.setNameEnSnapshot(menuItem.getNameEn());
            orderItem.setNameArSnapshot(menuItem.getNameAr());
            orderItem.setPriceSnapshot(menuItem.getPrice());
            orderItem.setQuantity(line.quantity());
            orderItem.setNote(line.note());
            orderItem.setLineTotal(lineTotal);
            order.addItem(orderItem);

            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal vatAmount = computeVat(restaurant, subtotal);
        order.setSubtotal(subtotal);
        order.setVatAmount(vatAmount);
        order.setTotal(subtotal.add(vatAmount));
        order.setOrderNumber(nextOrderNumber());
        order.setTrackingToken(Tokens.random(18));

        Order saved = orderRepository.save(order);

        notifyAndStream(saved, NotificationType.NEW_ORDER, "order.created",
                "New order " + saved.getOrderNumber() + " received");
        return OrderTrackingResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse getTracking(String trackingToken) {
        Order order = orderRepository.findWithItemsByTrackingToken(trackingToken)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", trackingToken));
        return OrderTrackingResponse.from(order);
    }

    @Transactional(readOnly = true)
    public SseEmitter streamForCustomer(String trackingToken) {
        if (orderRepository.findByTrackingToken(trackingToken).isEmpty()) {
            throw ResourceNotFoundException.of("Order", trackingToken);
        }
        return streamService.subscribe(OrderStreamService.orderChannel(trackingToken));
    }

    // ============================================================ dashboard

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> listForDashboard(OrderStatus status, Long branchId, Pageable pageable) {
        Long restaurantScope = accessGuard.scopedRestaurantId();
        Long branchScope = resolveBranchScope(branchId);
        return orderRepository.search(restaurantScope, branchScope, status, pageable)
                .map(OrderSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> liveForDashboard(Long branchId) {
        Long restaurantScope = accessGuard.scopedRestaurantId();
        Long branchScope = resolveBranchScope(branchId);
        return orderRepository.findLive(restaurantScope, branchScope, LIVE_STATUSES)
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getForDashboard(Long orderId) {
        Order order = loadWithItems(orderId);
        accessGuard.requireBranchAccess(order.getRestaurantId(), order.getBranchId());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse accept(Long orderId, AcceptOrderRequest request) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.ACCEPTED);
        order.setAcceptedAt(Instant.now());
        if (request != null && request.prepTimeMinutes() != null) {
            order.setPrepTimeMinutes(request.prepTimeMinutes());
        }
        notifyAndStream(order, NotificationType.ORDER_ACCEPTED, "order.accepted",
                "Order " + order.getOrderNumber() + " accepted");
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse decline(Long orderId, String reason) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.DECLINED);
        order.setDeclinedAt(Instant.now());
        order.setDeclineReason(reason);
        notifyAndStream(order, NotificationType.ORDER_DECLINED, "order.declined",
                "Order " + order.getOrderNumber() + " declined: " + reason);
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse markPreparing(Long orderId) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.PREPARING);
        order.setPreparingAt(Instant.now());
        streamOnly(order, "order.preparing");
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse markReady(Long orderId) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.READY);
        order.setReadyAt(Instant.now());
        notifyAndStream(order, NotificationType.ORDER_READY, "order.ready",
                "Order " + order.getOrderNumber() + " is ready");
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse complete(Long orderId) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.COMPLETED);
        order.setCompletedAt(Instant.now());
        notifyAndStream(order, NotificationType.ORDER_COMPLETED, "order.completed",
                "Order " + order.getOrderNumber() + " completed");
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse cancel(Long orderId, String reason) {
        Order order = loadGuarded(orderId);
        transition(order, OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());
        if (reason != null && !reason.isBlank()) {
            order.setInternalNote(reason);
        }
        streamOnly(order, "order.cancelled");
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public SseEmitter streamForDashboard(Long branchId) {
        Long branchScope = resolveBranchScope(branchId);
        Long restaurantScope = accessGuard.scopedRestaurantId();
        if (branchScope != null) {
            return streamService.subscribe(OrderStreamService.branchChannel(branchScope));
        }
        if (restaurantScope != null) {
            return streamService.subscribe(OrderStreamService.restaurantChannel(restaurantScope));
        }
        throw new BadRequestException("Platform admin must specify a branchId to stream");
    }

    // ============================================================ helpers

    private Long resolveTable(Restaurant restaurant, Branch branch, CreateOrderRequest request) {
        if (request.orderType() == OrderType.DINE_IN) {
            if (request.tableToken() == null || request.tableToken().isBlank()) {
                throw new BadRequestException(ErrorCode.TABLE_INVALID, "A table QR token is required for dine-in orders");
            }
            RestaurantTable table = tableService.getActiveByToken(request.tableToken());
            if (!table.getBranchId().equals(branch.getId())
                    || !table.getRestaurantId().equals(restaurant.getId())) {
                throw new BadRequestException(ErrorCode.TABLE_INVALID, "Table does not belong to this branch");
            }
            return table.getId();
        }
        return null; // takeaway
    }

    private BigDecimal computeVat(Restaurant restaurant, BigDecimal subtotal) {
        if (!restaurant.isVatEnabled() || restaurant.getVatRate() == null
                || restaurant.getVatRate().signum() == 0) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        return subtotal.multiply(restaurant.getVatRate())
                .divide(BigDecimal.valueOf(100), MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private String nextOrderNumber() {
        return "ORD-" + String.format("%06d", orderRepository.nextOrderNumber());
    }

    private Order loadWithItems(Long orderId) {
        return orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
    }

    private Order loadGuarded(Long orderId) {
        Order order = loadWithItems(orderId);
        accessGuard.requireBranchAccess(order.getRestaurantId(), order.getBranchId());
        return order;
    }

    private void transition(Order order, OrderStatus target) {
        if (!order.getStatus().canTransitionTo(target)) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION,
                    "Cannot change order from " + order.getStatus() + " to " + target);
        }
        order.setStatus(target);
    }

    private Long resolveBranchScope(Long requestedBranchId) {
        Long scoped = accessGuard.scopedBranchId();
        if (scoped != null) {
            return scoped; // branch-scoped users are pinned to their branch
        }
        if (requestedBranchId != null) {
            Branch branch = branchService.getEntity(requestedBranchId);
            accessGuard.requireRestaurantAccess(branch.getRestaurantId());
            return requestedBranchId;
        }
        return null;
    }

    private void notifyAndStream(Order order, NotificationType type, String eventName, String message) {
        notificationService.send(new NotificationPayload(
                type, order.getRestaurantId(), order.getBranchId(), order.getId(),
                order.getOrderNumber(), order.getCustomerPhone(), message));
        streamOnly(order, eventName);
    }

    private void streamOnly(Order order, String eventName) {
        OrderResponse dashboardView = OrderResponse.from(order);
        streamService.publishAll(
                List.of(OrderStreamService.restaurantChannel(order.getRestaurantId()),
                        OrderStreamService.branchChannel(order.getBranchId())),
                OrderEvent.of(eventName, dashboardView));
        streamService.publish(
                OrderStreamService.orderChannel(order.getTrackingToken()),
                OrderEvent.of(eventName, OrderTrackingResponse.from(order)));
    }
}
