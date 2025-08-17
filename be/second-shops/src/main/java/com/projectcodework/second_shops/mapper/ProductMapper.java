package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.CategoryDto;
import com.projectcodework.second_shops.dto.ImageDto;
import com.projectcodework.second_shops.dto.ProductDto;
import com.projectcodework.second_shops.model.Image;
import com.projectcodework.second_shops.model.Product;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public ProductDto mapToProductDto(Product product) {
        ProductDto productDto = new ProductDto();
        productDto.setId(product.getId());
        productDto.setName(product.getName());
        productDto.setBrand(product.getBrand());
        productDto.setPrice(product.getPrice());
        productDto.setInventory(product.getInventory());
        productDto.setDescription(product.getDescription());

        // Map category (without products to avoid circular reference)
        if (product.getCategory() != null) {
            CategoryDto categoryDto = new CategoryDto();
            categoryDto.setId(product.getCategory().getId());
            categoryDto.setName(product.getCategory().getName());
            productDto.setCategory(categoryDto);
        }

        // Map images
        if (product.getImages() != null) {
            List<ImageDto> imageDtos = product.getImages().stream()
                    .map(this::mapToImageDto)
                    .collect(Collectors.toList());
            productDto.setImages(imageDtos);
        }

        return productDto;
    }

    public List<ProductDto> mapToProductDtos(List<Product> products) {
        return products.stream()
                .map(this::mapToProductDto)
                .collect(Collectors.toList());
    }

    private ImageDto mapToImageDto(Image image) {
        ImageDto imageDto = new ImageDto();
        imageDto.setImageId(image.getId());
        imageDto.setImageName(image.getFileName());
        imageDto.setDownloadUrl(image.getDownloadUrl());
        return imageDto;
    }
}
