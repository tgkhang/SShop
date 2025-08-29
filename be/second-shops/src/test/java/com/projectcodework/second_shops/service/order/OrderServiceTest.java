package com.projectcodework.second_shops.service.order;

import com.projectcodework.second_shops.dto.OrderDto;
import com.projectcodework.second_shops.enums.OrderStatus;
import com.projectcodework.second_shops.model.*;
import com.projectcodework.second_shops.repository.*;
import com.projectcodework.second_shops.service.cart.ICartService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private ProductRepository productRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ICartService cartService;
    
    @InjectMocks
    private OrderService orderService;

    @Test
    public void testPlaceOrder_Success() {
        // Given
        Long userId = 1L;
        User user = new User();
        user.setId(userId);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john@example.com");

        Product product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100));
        product.setInventory(10);

        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantity(2);
        cartItem.setUnitPrice(BigDecimal.valueOf(100));

        Cart cart = new Cart();
        cart.setId(1L);
        cart.setItems(Set.of(cartItem));

        Order savedOrder = new Order();
        savedOrder.setOrderId(1L);
        savedOrder.setUser(user);
        savedOrder.setOrderDate(LocalDate.now());
        savedOrder.setOrderStatus(OrderStatus.PENDING);
        savedOrder.setTotalAmount(BigDecimal.valueOf(200));

        // When
        when(cartService.getCartByUserId(userId)).thenReturn(cart);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        // Then
        Order result = orderService.placeOrder(userId);
        
        assertNotNull(result);
        assertEquals(userId, result.getUser().getId());
        assertEquals(OrderStatus.PENDING, result.getOrderStatus());
        verify(cartService).clearCartById(cart.getId());
        verify(productRepository).save(product);
    }
}
