package com.projectcodework.second_shops.service.product;

import com.projectcodework.second_shops.dto.ImageDto;
import com.projectcodework.second_shops.dto.ProductDto;
import com.projectcodework.second_shops.exceptions.ProductNotFoundException;
import com.projectcodework.second_shops.model.Category;
import com.projectcodework.second_shops.model.Image;
import com.projectcodework.second_shops.model.Product;
import com.projectcodework.second_shops.repository.CategoryRepository;
import com.projectcodework.second_shops.repository.ImageRepository;
import com.projectcodework.second_shops.repository.ProductRepository;
import com.projectcodework.second_shops.request.AddProductRequest;
import com.projectcodework.second_shops.request.ProductUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    //MODEL MAPPER DIRRECTLY IN SERVICE VERSION
    private final ModelMapper modelMapper;
    private final ImageRepository imageRepository;

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException("Product not found!"));
    }

    @Override
    public Product addProduct(AddProductRequest request) {
        // check if category is found
        // yes set as new product category
        // else save as new category, set new product
        Category category = Optional.ofNullable(categoryRepository.findByName(request.getCategory().getName()))
                .orElseGet(() -> {
                    Category newCategory = new Category(request.getCategory().getName());
                    return categoryRepository.save(newCategory);
                });
        request.setCategory(category);
        return productRepository.save(createProduct(request, category));
    }

    private Product createProduct(AddProductRequest request, Category category) {
        return new Product(
                request.getName(),
                request.getBrand(),
                request.getPrice(),
                request.getInventory(),
                request.getDescription(),
                category);
    }

    @Override
    public Product updateProduct(ProductUpdateRequest request, Long productId) {
        // Finds the product by its ID.
        // Updates its fields using the ProductUpdateRequest.
        // Saves the updated product to the database.
        // Throws an exception if the product is not found
        return productRepository.findById(productId)
                .map(existProduct -> updateExistingProduct(existProduct, request))
                .map(productRepository::save)
                .orElseThrow(() -> new ProductNotFoundException("Product not found!"));
    }

    private Product updateExistingProduct(Product existProduct, ProductUpdateRequest request) {
        existProduct.setName(request.getName());
        existProduct.setBrand(request.getBrand());
        existProduct.setPrice(request.getPrice());
        existProduct.setInventory(request.getInventory());
        existProduct.setDescription(request.getDescription());

        Category category = categoryRepository.findByName(request.getCategory().getName());
        existProduct.setCategory(category);
        return existProduct;
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.findById(id).ifPresentOrElse(productRepository::delete, () -> {
            throw new ProductNotFoundException("Product not found!");
        });
    }

    @Override
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryName(category);
    }

    @Override
    public List<Product> getProductsByBrand(String brand) {
        return productRepository.findByBrand(brand);
    }

    @Override
    public List<Product> getProductsByCategoryAndBrand(String category, String brand) {
        return productRepository.findByCategoryNameAndBrand(category, brand);
    }

    @Override
    public List<Product> getProductsByName(String name) {
        return productRepository.findByName(name);
    }

    @Override
    public List<Product> getProductsByBrandAndName(String brand, String name) {
        return productRepository.findByBrandAndName(brand, name);
    }

    @Override
    public Long countProductsByBrandAndName(String brand, String name) {
        return productRepository.countByBrandAndName(brand, name);
    }


    @Override
    public List<ProductDto> getConvertedProducts(List<Product> products) {
        return products.stream().map(this::convertToDto).toList();
    }

    @Override
    public ProductDto convertToDto(Product product) {
        if (product == null) return null;
        ProductDto productDto = modelMapper.map(product, ProductDto.class);
        List<Image> images = imageRepository.findByProductId(product.getId());
        List<ImageDto> imagesDto = images.stream()
                .map(image -> modelMapper.map(image, ImageDto.class))
                .toList();

        productDto.setImages(imagesDto);
        return productDto;
    }
}
