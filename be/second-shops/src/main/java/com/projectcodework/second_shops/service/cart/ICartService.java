package com.projectcodework.second_shops.service.cart;

import com.projectcodework.second_shops.model.Cart;

import java.math.BigDecimal;

public interface ICartService {
    Cart getCartById(Long id);
    void clearCartById(Long id);
    BigDecimal getTotalPrice(Long id);
    Long createNewCart();
    Cart getCartByUserId(Long userId);
}
