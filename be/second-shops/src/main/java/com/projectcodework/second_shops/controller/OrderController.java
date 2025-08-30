package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.OrderDto;
import com.projectcodework.second_shops.enums.OrderStatus;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.OrderMapper;
import com.projectcodework.second_shops.model.Order;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.order.IOrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Tag(name = "Order Management", description = "APIs for managing orders")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/orders")
public class OrderController {
    private final IOrderService orderService;
    private final OrderMapper orderMapper;

    @Operation(summary = "Place Order", description = "Place a new order for a user")
    @PostMapping("/place/{userId}")
    public ResponseEntity<APIResponse> placeOrder(@PathVariable Long userId) {
        try {
            Order order = orderService.placeOrder(userId);
            OrderDto orderDto = orderMapper.mapToOrderDto(order);
            return ResponseEntity.status(CREATED).body(new APIResponse("Order placed successfully", orderDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(BAD_REQUEST).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while placing the order", null));
        }
    }

    @Operation(summary = "Get Order", description = "Retrieve an order by its ID")  
    @GetMapping("/{orderId}")
    public ResponseEntity<APIResponse> getOrder(@PathVariable Long orderId) {
        try {
            OrderDto orderDto = orderService.getOrder(orderId);
            return ResponseEntity.ok(new APIResponse("Order retrieved successfully", orderDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while retrieving the order", null));
        }
    }

    @Operation(summary = "Get User Orders", description = "Retrieve all orders for a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<APIResponse> getUserOrders(@PathVariable Long userId) {
        try {
            List<OrderDto> orders = orderService.getUserOrders(userId);
            if (orders.isEmpty()) {
                return ResponseEntity.ok(new APIResponse("No orders found for this user", orders));
            }
            return ResponseEntity.ok(new APIResponse("User orders retrieved successfully", orders));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while retrieving user orders", null));
        }
    }

    @Operation(summary = "Update Order Status", description = "Update the status of an existing order")
    @PutMapping("/{orderId}/status")
    public ResponseEntity<APIResponse> updateOrderStatus(@PathVariable Long orderId, 
                                                        @RequestParam OrderStatus orderStatus) {
        try {
            OrderDto updatedOrder = orderService.updateOrderStatus(orderId, orderStatus);
            return ResponseEntity.ok(new APIResponse("Order status updated successfully", updatedOrder));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while updating order status", null));
        }
    }

    @Operation(summary = "Cancel Order", description = "Cancel an existing order")
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<APIResponse> cancelOrder(@PathVariable Long orderId) {
        try {
            orderService.cancelOrder(orderId);
            return ResponseEntity.ok(new APIResponse("Order cancelled successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(BAD_REQUEST).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while cancelling the order", null));
        }
    }
}
