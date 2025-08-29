package com.projectcodework.second_shops.service.cart;

import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.model.Cart;
import com.projectcodework.second_shops.repository.CartItemRepository;
import com.projectcodework.second_shops.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Override
    @Transactional(readOnly = true)
    public Cart getCartById(Long id) {
        return cartRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Cart not found!"));
    }

    @Override
    @Transactional
    public void clearCartById(Long id) {
        // Validate cart exists first
        getCartById(id);
        // Delete the cart (cascade will handle cart items due to orphanRemoval = true)
        cartRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPrice(Long id) {
        Cart cart = getCartById(id);
        return cart.getTotalAmount();
    }

    @Override
    @Transactional
    public Cart createNewCart() {
        Cart cart = new Cart();
        return cartRepository.save(cart);
    }
}
