package com.projectcodework.second_shops.mapper;

import com.projectcodework.second_shops.dto.CategoryDto;
import com.projectcodework.second_shops.model.Category;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public CategoryDto mapToCategoryDto(Category category) {
        CategoryDto categoryDto = new CategoryDto();
        categoryDto.setId(category.getId());
        categoryDto.setName(category.getName());
        // Note: We don't include products to avoid circular reference
        return categoryDto;
    }

    public List<CategoryDto> mapToCategoryDtos(List<Category> categories) {
        return categories.stream()
                .map(this::mapToCategoryDto)
                .collect(Collectors.toList());
    }
}
