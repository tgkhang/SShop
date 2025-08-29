package com.projectcodework.second_shops.repository;

import com.projectcodework.second_shops.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

}