package com.projectcodework.second_shops.dto;

import com.projectcodework.second_shops.enums.OrderStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
public class OrderDto {
    private Long orderId;
    private LocalDate orderDate;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private Set<OrderItemDto> orderItems;
    private Long userId;
}
