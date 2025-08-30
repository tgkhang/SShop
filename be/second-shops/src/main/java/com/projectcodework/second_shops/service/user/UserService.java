package com.projectcodework.second_shops.service.user;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.exceptions.AlreadyExistsException;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.UserMapper;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.repository.UserRepository;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.UpdateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    @Override
    @Transactional
    public User createUser(CreateUserRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }

        User user = new User(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPassword() //TODO : NEED HASH HERE
        );
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(UpdateUserRequest request, Long userId) {
        User existingUser = getUserById(userId);
        
        if (request.getFirstName() != null) {
            existingUser.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            existingUser.setLastName(request.getLastName());
        }

        return userRepository.save(existingUser);
    }

    @Override
    @Transactional
    public void deleteUserById(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserDtoById(Long userId) {
        User user = getUserById(userId);
        return userMapper.mapToUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        return userMapper.mapToUserDtos(users);
    }

    @Override
    public UserDto convertUserToDto(User user) {
        return userMapper.mapToUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
