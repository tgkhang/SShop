package com.projectcodework.second_shops.repository;

import com.projectcodework.second_shops.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageRepository extends JpaRepository<Image,Long> {
}
