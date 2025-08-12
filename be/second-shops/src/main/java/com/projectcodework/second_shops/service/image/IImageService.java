package com.projectcodework.second_shops.service.image;

import com.projectcodework.second_shops.dto.ImageDto;
import com.projectcodework.second_shops.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IImageService {
    Image getImageById(Long id);
    void delteImageById(Long id);
    List<ImageDto> saveImages(List<MultipartFile> files, Long productId);
    void updateImage(MultipartFile file, Long imageId);
}
