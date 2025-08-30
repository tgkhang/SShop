package com.projectcodework.second_shops.service.cart;

import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.model.Cart;
import com.projectcodework.second_shops.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService {
    private final CartRepository cartRepository;

    @Override
    @Transactional(readOnly = true)
    public Cart getCartById(Long id) {
        return cartRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Cart not found!"));
    }

    @Override
    @Transactional
    public void clearCartById(Long id) {
        // Get the cart and clear its items while keeping the cart entity
        Cart cart = getCartById(id);
        cart.getItems().clear();
        cart.setTotalAmount(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPrice(Long id) {
        Cart cart = getCartById(id);
        return cart.getTotalAmount();
    }

    @Override
    @Transactional
    public Long createNewCart() {
        Cart newCart = new Cart();
        Cart savedCart = cartRepository.save(newCart);
        return savedCart.getId();
    }

    @Override
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }


}
