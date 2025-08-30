package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.model.User;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserMapper {
    private final ModelMapper modelMapper;
    private final CartMapper cartMapper;

    public UserDto mapToUserDto(User user) {
        if (user == null) return null;
        
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setEmail(user.getEmail());
        
        // Map cart if exists (avoid circular reference issues)
        if (user.getCart() != null) {
            userDto.setCart(cartMapper.mapToCartDto(user.getCart()));
        }
        
        return userDto;
    }

    public List<UserDto> mapToUserDtos(List<User> users) {
        return users.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    // Alternative mapping using ModelMapper
    public UserDto toDto(User user) {
        if (user == null) return null;
        return modelMapper.map(user, UserDto.class);
    }

    public List<UserDto> toDtos(List<User> users) {
        return users.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
