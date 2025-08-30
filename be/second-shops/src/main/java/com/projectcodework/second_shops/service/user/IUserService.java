package com.projectcodework.second_shops.service.user;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.UpdateUserRequest;

import java.util.List;

public interface IUserService {
    User getUserById(Long userId);
    User createUser(CreateUserRequest request);
    User updateUser(UpdateUserRequest request, Long userId);
    void deleteUserById(Long userId);
    
    UserDto getUserDtoById(Long userId);
    List<UserDto> getAllUsers();
    UserDto convertUserToDto(User user);
    User getUserByEmail(String email);
}
