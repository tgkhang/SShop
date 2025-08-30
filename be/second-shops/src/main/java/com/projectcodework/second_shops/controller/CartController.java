package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.CartDto;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.CartMapper;
import com.projectcodework.second_shops.model.Cart;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.cart.ICartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import static org.springframework.http.HttpStatus.*;

@Tag(name = "Cart Management", description = "Endpoints for managing shopping carts")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/carts")
public class CartController {
    private final ICartService cartService;
    private final CartMapper cartMapper;

    @Operation(summary = "Get Cart", description = "Retrieve a cart by its ID")
    @GetMapping("/{cartId}")
    public ResponseEntity<APIResponse> getCart(@PathVariable Long cartId) {
        try {
            Cart cart = cartService.getCartById(cartId);
            CartDto cartDto = cartMapper.mapToCartDto(cart);
            return ResponseEntity.ok(new APIResponse("Success", cartDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while retrieving the cart", null));
        }
    }

    @Operation(summary = "Clear Cart", description = "Clear all items from the cart")
    @DeleteMapping("/{cartId}")
    public ResponseEntity<APIResponse> clearCart(@PathVariable Long cartId) {
        try {
            cartService.clearCartById(cartId);
            return ResponseEntity.ok(new APIResponse("Clear Cart Success!", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while clearing the cart", null));
        }
    }

    @Operation(summary = "Get Total Price", description = "Get the total price of all items in the cart")
    @GetMapping("/{cartId}/total-price")
    public ResponseEntity<APIResponse> getTotalPrice(@PathVariable Long cartId) {
        try {
            BigDecimal totalPrice = cartService.getTotalPrice(cartId);
            return ResponseEntity.ok(new APIResponse("Total Price", totalPrice));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while calculating total price", null));
        }
    }

    @Operation(summary = "Create Cart", description = "Create a new shopping cart")
    @PostMapping("/create")
    public ResponseEntity<APIResponse> createCart() {
        try {
            Long cartId = cartService.createNewCart();
            return ResponseEntity.status(CREATED).body(new APIResponse("Cart created successfully", cartId));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse(e.getMessage(), null));
        }
    }
}
