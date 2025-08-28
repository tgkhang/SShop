package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.CategoryDto;
import com.projectcodework.second_shops.dto.ImageDto;
import com.projectcodework.second_shops.dto.ProductDto;
import com.projectcodework.second_shops.model.Image;
import com.projectcodework.second_shops.model.Product;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {
    //MODELMAPPER VERSION OF MAPPER
    private final ModelMapper modelMapper;

    public ProductDto toDto(Product product) {
        if (product == null) return null;
        ProductDto dto = modelMapper.map(product, ProductDto.class);

        // Handle special cases manually
        if (product.getCategory() != null) {
            dto.setCategory(
                    modelMapper.map(product.getCategory(), CategoryDto.class)
            );
        }
        if (product.getImages() != null) {
            dto.setImages(
                    product.getImages().stream()
                            .map(image -> modelMapper.map(image, ImageDto.class))
                            .collect(Collectors.toList())
            );
        }
        return dto;
    }

    public List<ProductDto> toDtos(List<Product> products) {
        return products.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    //IN HAND VERSION OF MAPPER
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
