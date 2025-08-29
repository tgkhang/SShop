package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.OrderDto;
import com.projectcodework.second_shops.dto.OrderItemDto;
import com.projectcodework.second_shops.model.Order;
import com.projectcodework.second_shops.model.OrderItem;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderMapper {
    private final ModelMapper modelMapper;
    private final ProductMapper productMapper;

    public OrderDto mapToOrderDto(Order order) {
        OrderDto orderDto = modelMapper.map(order, OrderDto.class);
        if (order.getUser() != null) {
            orderDto.setUserId(order.getUser().getId());
        }
        
        Set<OrderItemDto> orderItemDtos = order.getOrderItems().stream()
                .map(this::mapToOrderItemDto)
                .collect(Collectors.toSet());
        orderDto.setOrderItems(orderItemDtos);
        
        return orderDto;
    }

    public OrderItemDto mapToOrderItemDto(OrderItem orderItem) {
        OrderItemDto orderItemDto = modelMapper.map(orderItem, OrderItemDto.class);
        if (orderItem.getProduct() != null) {
            orderItemDto.setProduct(productMapper.mapToProductDto(orderItem.getProduct()));
        }
        return orderItemDto;
    }

    public List<OrderDto> mapToOrderDtos(List<Order> orders) {
        return orders.stream()
                .map(this::mapToOrderDto)
                .collect(Collectors.toList());
    }
}
