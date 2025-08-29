package com.projectcodework.second_shops.service.order;

import com.projectcodework.second_shops.dto.OrderDto;
import com.projectcodework.second_shops.enums.OrderStatus;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.OrderMapper;
import com.projectcodework.second_shops.model.*;
import com.projectcodework.second_shops.repository.OrderRepository;
import com.projectcodework.second_shops.repository.ProductRepository;
import com.projectcodework.second_shops.repository.UserRepository;
import com.projectcodework.second_shops.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ICartService cartService;
    private final OrderMapper orderMapper;

    @Override
    @Transactional
    public Order placeOrder(Long userId) {
        Cart cart = cartService.getCartByUserId(userId);

        if (cart == null || cart.getItems().isEmpty()) {
            throw new ResourceNotFoundException("Cart is empty for user: " + userId);
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Create order
        Order order = createOrder(cart, user);

        // Clear the cart after order is placed
        cartService.clearCartById(cart.getId());

        return orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return orderMapper.mapToOrderDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        List<Order> orders = orderRepository.findByUserId(userId);
        return orderMapper.mapToOrderDtos(orders);
    }

    private Order createOrder(Cart cart, User user) {
        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDate.now());
        order.setOrderStatus(OrderStatus.PENDING);

        // Create order items from cart items
        Set<OrderItem> orderItems = createOrderItems(order, cart);
        order.setOrderItems(orderItems);

        // Calculate total amount
        BigDecimal totalAmount = calculateTotalAmount(orderItems);
        order.setTotalAmount(totalAmount);

        return order;
    }

    private Set<OrderItem> createOrderItems(Order order, Cart cart) {
        return cart.getItems().stream()
                .map(cartItem -> {
                    Product product = cartItem.getProduct();
                    // Check if product has enough inventory
                    if (product.getInventory() < cartItem.getQuantity()) {
                        throw new RuntimeException("Insufficient inventory for product: " + product.getName() + 
                                ". Available: " + product.getInventory() + ", Requested: " + cartItem.getQuantity());
                    }
                    
                    // Update product inventory
                    product.setInventory(product.getInventory() - cartItem.getQuantity());
                    productRepository.save(product);
                    
                    // Create order item
                    return new OrderItem(order, product, cartItem.getQuantity(), cartItem.getUnitPrice());
                })
                .collect(HashSet::new, HashSet::add, HashSet::addAll);
    }

    private BigDecimal calculateTotalAmount(Set<OrderItem> orderItems) {
        return orderItems.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus orderStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        
        order.setOrderStatus(orderStatus);
        Order updatedOrder = orderRepository.save(order);
        return orderMapper.mapToOrderDto(updatedOrder);
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        
        // Only allow cancellation of pending or processing orders
        if (order.getOrderStatus() == OrderStatus.SHIPPED || 
            order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel order with status: " + order.getOrderStatus());
        }
        
        // Restore product inventory
        order.getOrderItems().forEach(orderItem -> {
            Product product = orderItem.getProduct();
            product.setInventory(product.getInventory() + orderItem.getQuantity());
            productRepository.save(product);
        });
        
        order.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
