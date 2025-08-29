package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.CartDto;
import com.projectcodework.second_shops.model.Cart;
import org.springframework.stereotype.Component;

@Component
public class CartMapper {
    private final CartItemMapper cartItemMapper;

    public CartMapper(CartItemMapper cartItemMapper) {
        this.cartItemMapper = cartItemMapper;
    }

    public CartDto mapToCartDto(Cart cart) {
        CartDto cartDto = new CartDto();
        cartDto.setId(cart.getId());
        cartDto.setTotalAmount(cart.getTotalAmount());
        cartDto.setItems(cartItemMapper.mapToCartItemDtoSet(cart.getItems()));
        return cartDto;
    }
}
