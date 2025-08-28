package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.dto.ProductDto;
import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.mapper.ProductMapper;
import com.projectcodework.second_shops.model.Product;
import com.projectcodework.second_shops.request.AddProductRequest;
import com.projectcodework.second_shops.request.ProductUpdateRequest;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.product.IProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Product Management", description = "APIs for managing products")
@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/products")
public class ProductController {
    private final IProductService productService;
    private final ProductMapper productMapper;

    @GetMapping("/all")
    public ResponseEntity<APIResponse> getAllProducts() {
        List<Product> products = productService.getAllProducts();

        //2 METHOD OF TRANSFER
        List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
        //List<ProductDto> dtos= productService.getConvertedProducts(products);
        return ResponseEntity.ok(new APIResponse("success", productDtos));
    }

    @GetMapping("/{productId}/product")
    public ResponseEntity<APIResponse> getProductById(@PathVariable Long productId) {
        try {
            Product product = productService.getProductById(productId);
            ProductDto productDto = productMapper.mapToProductDto(product);
            //ProductDto productDto1 = productService.convertToDto(product);
            return ResponseEntity.ok(new APIResponse("success", productDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<APIResponse> addProduct(@RequestBody AddProductRequest addProductRequest) {
        try {
            Product product = productService.addProduct(addProductRequest);
            ProductDto productDto = productMapper.mapToProductDto(product);
            return ResponseEntity.ok(new APIResponse("success", productDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new APIResponse(e.getMessage(), null));
        }

    }

    @PutMapping("/{productId}/update")
    public ResponseEntity<APIResponse> updateProduct(@RequestBody ProductUpdateRequest request,
            @PathVariable Long productId) {
        try {
            Product updatedProduct = productService.updateProduct(request, productId);
            ProductDto productDto = productMapper.mapToProductDto(updatedProduct);
            return ResponseEntity.ok(new APIResponse("success", productDto));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @DeleteMapping("/{productId}/delete")
    public ResponseEntity<APIResponse> deleteProduct(@PathVariable Long productId) {
        try {
            productService.deleteProduct(productId);
            return ResponseEntity.ok(new APIResponse("Delete product success!", productId));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/by/brand-and-name")
    public ResponseEntity<APIResponse> getProductByBrandAndName(@RequestParam String brand, @RequestParam String name) {
        try {
            List<Product> products = productService.getProductsByBrandAndName(brand, name);

            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            //2 method
            List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
            //List<ProductDto> productDtos1 = productService.getConvertedProducts(products);

            return ResponseEntity.ok(new APIResponse("success", productDtos));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/by/category-and-brand")
    public ResponseEntity<APIResponse> getProductByCategoryAndBrand(@RequestParam String category,
            @RequestParam String brand) {
        try {
            List<Product> products = productService.getProductsByCategoryAndBrand(category, brand);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
            return ResponseEntity.ok(new APIResponse("success", productDtos));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/{name}/products")
    public ResponseEntity<APIResponse> getProductByName(@PathVariable String name) {
        try {
            List<Product> products = productService.getProductsByName(name);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
            return ResponseEntity.ok(new APIResponse("success", productDtos));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/by-brand")
    public ResponseEntity<APIResponse> getProductByBrand(@RequestParam String brand) {
        try {
            List<Product> products = productService.getProductsByBrand(brand);
            List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
            return ResponseEntity.ok(new APIResponse("success", productDtos));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/by-category")
    public ResponseEntity<APIResponse> getProductByCategory(@RequestParam String category) {
        try {
            List<Product> products = productService.getProductsByCategory(category);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            List<ProductDto> productDtos = productMapper.mapToProductDtos(products);
            return ResponseEntity.ok(new APIResponse("success", productDtos));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/count/by-brand/by-name")
    public ResponseEntity<APIResponse> countProductCountByBrandAndName(@RequestParam String brand,
            @RequestParam String name) {
        try {
            var products = productService.countProductsByBrandAndName(brand, name);

            return ResponseEntity.ok(new APIResponse("success", products));
        } catch (Exception e) {
            return ResponseEntity.ok(new APIResponse(e.getMessage(), null));
        }
    }
}