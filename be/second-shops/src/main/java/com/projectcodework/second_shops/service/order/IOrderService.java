package com.projectcodework.second_shops.service.order;

import com.projectcodework.second_shops.dto.OrderDto;
import com.projectcodework.second_shops.enums.OrderStatus;
import com.projectcodework.second_shops.model.Order;

import java.util.List;

public interface IOrderService {
    Order placeOrder(Long userId);
    OrderDto getOrder(Long orderId);
    List<OrderDto> getUserOrders(Long userId);
    OrderDto updateOrderStatus(Long orderId, OrderStatus orderStatus);
    void cancelOrder(Long orderId);
}
