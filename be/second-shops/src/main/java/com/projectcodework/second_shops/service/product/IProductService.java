package com.projectcodework.second_shops.service.product;

import com.projectcodework.second_shops.model.Product;
import com.projectcodework.second_shops.request.AddProductRequest;

import java.util.List;

public interface IProductService {

    List<Product> getAllProducts();
    Product getProductById(Long id);
    Product addProduct(AddProductRequest product);
    void updateProduct(Product product, Long productId);
    void deleteProduct(Long id);
    List<Product> getProductsByCategory(String category);
    List<Product> getProductsByBrand(String brand);
    List<Product> getProductsByCategoryAndBrand(String category, String brand);
    List<Product> getProductsByName(String name);
    List<Product> getProductsByBrandAndName(String brand, String name);
    Long countProductsByBrandAndName(String brand, String name);
}

