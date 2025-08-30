package com.projectcodework.second_shops.service.user;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.exceptions.AlreadyExistsException;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.UserMapper;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.repository.UserRepository;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.UpdateUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDto testUserDto;
    private CreateUserRequest createUserRequest;
    private UpdateUserRequest updateUserRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("password123");

        testUserDto = new UserDto();
        testUserDto.setId(1L);
        testUserDto.setFirstName("John");
        testUserDto.setLastName("Doe");
        testUserDto.setEmail("john.doe@example.com");

        createUserRequest = new CreateUserRequest();
        createUserRequest.setFirstName("John");
        createUserRequest.setLastName("Doe");
        createUserRequest.setEmail("john.doe@example.com");
        createUserRequest.setPassword("password123");

        updateUserRequest = new UpdateUserRequest();
        updateUserRequest.setFirstName("Jane");
        updateUserRequest.setLastName("Smith");
    }

    @Test
    void getUserById_ExistingUser_ShouldReturnUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        User result = userService.getUserById(1L);

        // Then
        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());
        assertEquals(testUser.getEmail(), result.getEmail());
        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_NonExistingUser_ShouldThrowException() {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(1L));
        verify(userRepository).findById(1L);
    }

    @Test
    void createUser_NewUser_ShouldCreateSuccessfully() {
        // Given
        when(userRepository.existsByEmail(createUserRequest.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.createUser(createUserRequest);

        // Then
        assertNotNull(result);
        verify(userRepository).existsByEmail(createUserRequest.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_ExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.existsByEmail(createUserRequest.getEmail())).thenReturn(true);

        // When & Then
        assertThrows(AlreadyExistsException.class, () -> userService.createUser(createUserRequest));
        verify(userRepository).existsByEmail(createUserRequest.getEmail());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUser_ExistingUser_ShouldUpdateSuccessfully() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.updateUser(updateUserRequest, 1L);

        // Then
        assertNotNull(result);
        verify(userRepository).findById(1L);
        verify(userRepository).save(testUser);
    }

    @Test
    void deleteUserById_ExistingUser_ShouldDeleteSuccessfully() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        userService.deleteUserById(1L);

        // Then
        verify(userRepository).findById(1L);
        verify(userRepository).delete(testUser);
    }

    @Test
    void getUserDtoById_ExistingUser_ShouldReturnUserDto() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userMapper.mapToUserDto(testUser)).thenReturn(testUserDto);

        // When
        UserDto result = userService.getUserDtoById(1L);

        // Then
        assertNotNull(result);
        assertEquals(testUserDto.getId(), result.getId());
        assertEquals(testUserDto.getEmail(), result.getEmail());
        verify(userRepository).findById(1L);
        verify(userMapper).mapToUserDto(testUser);
    }

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        // Given
        List<User> users = List.of(testUser);
        List<UserDto> userDtos = List.of(testUserDto);
        when(userRepository.findAll()).thenReturn(users);
        when(userMapper.mapToUserDtos(users)).thenReturn(userDtos);

        // When
        List<UserDto> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(userRepository).findAll();
        verify(userMapper).mapToUserDtos(users);
    }

    @Test
    void getUserByEmail_ExistingEmail_ShouldReturnUser() {
        // Given
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(testUser));

        // When
        User result = userService.getUserByEmail("john.doe@example.com");

        // Then
        assertNotNull(result);
        assertEquals(testUser.getEmail(), result.getEmail());
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void getUserByEmail_NonExistingEmail_ShouldThrowException() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, 
                () -> userService.getUserByEmail("nonexistent@example.com"));
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void convertUserToDto_ShouldReturnUserDto() {
        // Given
        when(userMapper.mapToUserDto(testUser)).thenReturn(testUserDto);

        // When
        UserDto result = userService.convertUserToDto(testUser);

        // Then
        assertNotNull(result);
        assertEquals(testUserDto.getId(), result.getId());
        verify(userMapper).mapToUserDto(testUser);
    }
}
