package com.projectcodework.second_shops.response;

import lombok.AllArgsConstructor;
import lombok.Data;

//test
@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String message;
}
