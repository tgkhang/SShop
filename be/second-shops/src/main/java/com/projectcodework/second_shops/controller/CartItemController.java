package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.CartItemDto;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.CartItemMapper;
import com.projectcodework.second_shops.model.CartItem;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.cart.ICartItemService;
import com.projectcodework.second_shops.service.cart.ICartService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static org.springframework.http.HttpStatus.*;

@Tag(name = "Cart Item Management", description = "Endpoints for managing cart items")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/cartItems")
public class CartItemController {
    private final ICartItemService cartItemService;
    private final ICartService cartService;
    private final CartItemMapper cartItemMapper;

    // add by path
    // @PutMapping("/{cartId}/items/{productId}")
    // public ResponseEntity<APIResponse> addItemToCart(@PathVariable Long cartId,
    // @PathVariable Long productId,
    // @RequestParam int quantity) {
    // try {
    // cartItemService.addItemToCart(cartId, productId, quantity);
    // return ResponseEntity.ok(new APIResponse("Add Item Success", null));
    // } catch (Exception e) {
    // return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(),
    // null));
    // }
    // }

    // add by params
    @PostMapping("/item/add")
    public ResponseEntity<APIResponse> addItemToCart(@RequestParam(required = false) Long cartId,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {
        try {
            if (cartId == null) {
                cartId = cartService.createNewCart();
            }
            cartItemService.addItemToCart(cartId, productId, quantity);
            return ResponseEntity.ok(new APIResponse("Add item successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while adding item to cart", null));
        }
    }

    @Operation(summary = "Remove Cart Item", description = "Remove an item from the cart")
    @DeleteMapping("/{cartId}/items/{productId}")
    public ResponseEntity<APIResponse> removeItemFromCart(@PathVariable Long cartId,
                                                          @PathVariable Long productId) {
        try {
            cartItemService.removeItemFromCart(cartId, productId);
            return ResponseEntity.ok(new APIResponse("Remove Item Success", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while removing item from cart", null));
        }
    }

    @Operation(summary = "Update Cart Item Quantity", description = "Update the quantity of a cart item")
    @PutMapping("/{cartId}/items/{productId}/quantity")
    public ResponseEntity<APIResponse> updateItemQuantity(@PathVariable Long cartId,
                                                          @PathVariable Long productId,
                                                          @RequestParam int quantity) {
        try {
            cartItemService.updateItemQuantity(cartId, productId, quantity);
            return ResponseEntity.ok(new APIResponse("Update Item Success", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while updating item quantity", null));
        }
    }

    @Operation(summary = "Get Cart Item", description = "Retrieve a cart item by its cart ID and product ID")
    @GetMapping("/{cartId}/items/{productId}")
    public ResponseEntity<APIResponse> getCartItem(@PathVariable Long cartId,
                                                   @PathVariable Long productId) {
        try {
            CartItem cartItem = cartItemService.getCartItem(cartId, productId);
            CartItemDto cartItemDto = cartItemMapper.mapToCartItemDto(cartItem);
            return ResponseEntity.ok(new APIResponse("Success", cartItemDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR).body(new APIResponse("An error occurred while retrieving the cart item", null));
        }
    }
}
