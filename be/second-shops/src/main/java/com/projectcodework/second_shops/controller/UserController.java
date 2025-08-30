package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.exceptions.AlreadyExistsException;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.UpdateUserRequest;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.user.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Tag(name = "User Management", description = "APIs for managing users")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/users")
public class UserController {
    private final IUserService userService;

    @Operation(summary = "Get all users", description = "Retrieve a list of all users")
    @GetMapping("/all")
    public ResponseEntity<APIResponse> getAllUsers() {
        try {
            List<UserDto> users = userService.getAllUsers();
            return ResponseEntity.ok(new APIResponse("Users retrieved successfully", users));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while retrieving users", null));
        }
    }

    @Operation(summary = "Get user by ID", description = "Retrieve a specific user by their ID")
    @GetMapping("/{userId}")
    public ResponseEntity<APIResponse> getUserById(@PathVariable Long userId) {
        try {
            UserDto user = userService.getUserDtoById(userId);
            return ResponseEntity.ok(new APIResponse("User retrieved successfully", user));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while retrieving the user", null));
        }
    }

    @Operation(summary = "Create new user", description = "Create a new user account")
    @PostMapping("/create")
    public ResponseEntity<APIResponse> createUser(@RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUser(request);
            UserDto userDto = userService.convertUserToDto(user);
            return ResponseEntity.status(CREATED)
                    .body(new APIResponse("User created successfully", userDto));
        } catch (AlreadyExistsException e) {
            return ResponseEntity.status(CONFLICT)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while creating the user", null));
        }
    }

    @Operation(summary = "Update user", description = "Update user information")
    @PutMapping("/update/{userId}")
    public ResponseEntity<APIResponse> updateUser(@RequestBody UpdateUserRequest request, 
                                                 @PathVariable Long userId) {
        try {
            User user = userService.updateUser(request, userId);
            UserDto userDto = userService.convertUserToDto(user);
            return ResponseEntity.ok(new APIResponse("User updated successfully", userDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while updating the user", null));
        }
    }

    @Operation(summary = "Delete user", description = "Delete a user account")
    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<APIResponse> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUserById(userId);
            return ResponseEntity.ok(new APIResponse("User deleted successfully", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while deleting the user", null));
        }
    }

    @Operation(summary = "Get user by email", description = "Retrieve a user by their email address")
    @GetMapping("/email/{email}")
    public ResponseEntity<APIResponse> getUserByEmail(@PathVariable String email) {
        try {
            User user = userService.getUserByEmail(email);
            UserDto userDto = userService.convertUserToDto(user);
            return ResponseEntity.ok(new APIResponse("User retrieved successfully", userDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(NOT_FOUND)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred while retrieving the user", null));
        }
    }
}
