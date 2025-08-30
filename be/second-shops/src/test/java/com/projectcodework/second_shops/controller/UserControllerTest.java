package com.projectcodework.second_shops.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.exceptions.AlreadyExistsException;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.UpdateUserRequest;
import com.projectcodework.second_shops.service.user.IUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IUserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserDto testUserDto;
    private User testUser;
    private CreateUserRequest createUserRequest;
    private UpdateUserRequest updateUserRequest;

    @BeforeEach
    void setUp() {
        testUserDto = new UserDto();
        testUserDto.setId(1L);
        testUserDto.setFirstName("John");
        testUserDto.setLastName("Doe");
        testUserDto.setEmail("john.doe@example.com");

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("password123");

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
    void getAllUsers_ShouldReturnListOfUsers() throws Exception {
        // Given
        when(userService.getAllUsers()).thenReturn(List.of(testUserDto));

        // When & Then
        mockMvc.perform(get("/api/v1/users/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Users retrieved successfully"))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].firstName").value("John"))
                .andExpect(jsonPath("$.data[0].lastName").value("Doe"))
                .andExpect(jsonPath("$.data[0].email").value("john.doe@example.com"));
    }

    @Test
    void getUserById_ExistingUser_ShouldReturnUser() throws Exception {
        // Given
        when(userService.getUserDtoById(1L)).thenReturn(testUserDto);

        // When & Then
        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User retrieved successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"));
    }

    @Test
    void getUserById_NonExistingUser_ShouldReturnNotFound() throws Exception {
        // Given
        when(userService.getUserDtoById(anyLong()))
                .thenThrow(new ResourceNotFoundException("User not found: 999"));

        // When & Then
        mockMvc.perform(get("/api/v1/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found: 999"));
    }

    @Test
    void createUser_ValidRequest_ShouldCreateUser() throws Exception {
        // Given
        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(testUser);
        when(userService.convertUserToDto(any(User.class))).thenReturn(testUserDto);

        // When & Then
        mockMvc.perform(post("/api/v1/users/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createUserRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User created successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"));
    }

    @Test
    void createUser_ExistingEmail_ShouldReturnConflict() throws Exception {
        // Given
        when(userService.createUser(any(CreateUserRequest.class)))
                .thenThrow(new AlreadyExistsException("User with email john.doe@example.com already exists"));

        // When & Then
        mockMvc.perform(post("/api/v1/users/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createUserRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User with email john.doe@example.com already exists"));
    }

    @Test
    void updateUser_ValidRequest_ShouldUpdateUser() throws Exception {
        // Given
        when(userService.updateUser(any(UpdateUserRequest.class), anyLong())).thenReturn(testUser);
        when(userService.convertUserToDto(any(User.class))).thenReturn(testUserDto);

        // When & Then
        mockMvc.perform(put("/api/v1/users/update/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUserRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User updated successfully"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void deleteUser_ExistingUser_ShouldDeleteUser() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/v1/users/delete/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted successfully"));
    }

    @Test
    void getUserByEmail_ExistingEmail_ShouldReturnUser() throws Exception {
        // Given
        when(userService.getUserByEmail("john.doe@example.com")).thenReturn(testUser);
        when(userService.convertUserToDto(any(User.class))).thenReturn(testUserDto);

        // When & Then
        mockMvc.perform(get("/api/v1/users/email/john.doe@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User retrieved successfully"))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"));
    }
}
