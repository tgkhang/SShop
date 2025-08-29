package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.CartItemDto;
import com.projectcodework.second_shops.model.CartItem;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class CartItemMapper {
    private final ProductMapper productMapper;

    public CartItemMapper(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    public CartItemDto mapToCartItemDto(CartItem cartItem) {
        CartItemDto cartItemDto = new CartItemDto();
        cartItemDto.setId(cartItem.getId());
        cartItemDto.setQuantity(cartItem.getQuantity());
        cartItemDto.setUnitPrice(cartItem.getUnitPrice());
        cartItemDto.setTotalPrice(cartItem.getTotalPrice());
        cartItemDto.setProduct(productMapper.toDto(cartItem.getProduct()));
        return cartItemDto;
    }

    public Set<CartItemDto> mapToCartItemDtoSet(Set<CartItem> cartItems) {
        return cartItems.stream()
                .map(this::mapToCartItemDto)
                .collect(Collectors.toSet());
    }
}
