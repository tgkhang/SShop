package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.UserDto;
import com.projectcodework.second_shops.exceptions.AlreadyExistsException;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.request.CreateUserRequest;
import com.projectcodework.second_shops.request.LoginRequest;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.response.JwtResponse;
import com.projectcodework.second_shops.security.jwt.JwtUtils;
import com.projectcodework.second_shops.security.model.ShopUser;
import com.projectcodework.second_shops.service.user.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "APIs for user authentication")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/auth")
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final IUserService userService;

    @Operation(summary = "User Login", description = "Authenticate user and return JWT token")
    @PostMapping("/login")
    public ResponseEntity<APIResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateTokenForUser(authentication);
            ShopUser userDetails = (ShopUser) authentication.getPrincipal();
            
            JwtResponse jwtResponse = new JwtResponse(userDetails.getId(), jwt);
            
            return ResponseEntity.ok(new APIResponse("Login Success!", jwtResponse));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new APIResponse("Invalid email or password!", null));
        }
    }

    @Operation(summary = "User Registration", description = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<APIResponse> register(@Valid @RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUser(request);
            UserDto userDto = userService.convertUserToDto(user);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new APIResponse("User registered successfully", userDto));
        } catch (AlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new APIResponse(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new APIResponse("An error occurred during registration", null));
        }
    }

    @Operation(summary = "Get Default Users", description = "Get list of default users for testing")
    @GetMapping("/default-users")
    public ResponseEntity<APIResponse> getDefaultUsers() {
        String usersInfo = """
            Default Users Created:
            
            ADMIN USER:
            Email: admin@shop.com
            Password: admin123
            Roles: ADMIN, USER
            
            REGULAR USERS:
            Email: user1@shop.com - Password: password123
            Email: user2@shop.com - Password: password123  
            Email: user3@shop.com - Password: password123
            Email: user4@shop.com - Password: password123
            Email: user5@shop.com - Password: password123
            Roles: USER
            
            Use these credentials to test the authentication system.
            """;
        
        return ResponseEntity.ok(new APIResponse("Default users information", usersInfo));
    }
}
