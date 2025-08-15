package com.projectcodework.second_shops.controller;

import com.projectcodework.second_shops.exceptions.ResourceNotFoundException;
import com.projectcodework.second_shops.model.Product;
import com.projectcodework.second_shops.request.AddProductRequest;
import com.projectcodework.second_shops.request.ProductUpdateRequest;
import com.projectcodework.second_shops.response.APIResponse;
import com.projectcodework.second_shops.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/products")
public class ProductController {
    private final IProductService productService;

    @GetMapping("/all")
    public ResponseEntity<APIResponse> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(new APIResponse("success", products));
    }

    @GetMapping("/product/{productId}/product")
    public ResponseEntity<APIResponse> getProductById(@PathVariable Long productId) {
        try {
            Product product = productService.getProductById(productId);
            return ResponseEntity.ok(new APIResponse("success", product));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<APIResponse> addProduct(@RequestBody AddProductRequest addProductRequest) {
        try {
            Product product = productService.addProduct(addProductRequest);
            return ResponseEntity.ok(new APIResponse("success", product));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new APIResponse(e.getMessage(), null));
        }

    }

    @PutMapping("/product/{productId}/update")
    public ResponseEntity<APIResponse> updateProduct(@RequestBody ProductUpdateRequest request,
            @PathVariable Long productId) {
        try {
            Product updatedProduct = productService.updateProduct(request, productId);
            return ResponseEntity.ok(new APIResponse("success", updatedProduct));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @DeleteMapping("/product/{productId}/delete")
    public ResponseEntity<APIResponse> deleteProduct(@PathVariable Long productId) {
        try {
            productService.deleteProduct(productId);
            return ResponseEntity.ok(new APIResponse("Delete product success!", productId));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/products/by/brand-and-name")
    public ResponseEntity<APIResponse> getProductByBrandAndName(@RequestParam String brand, @RequestParam String name) {
        try {
            List<Product> products = productService.getProductsByBrandAndName(brand, name);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            return ResponseEntity.ok(new APIResponse("success", products));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/products/by/category-and-brand")
    public ResponseEntity<APIResponse> getProductByCategoryAndBrand(@RequestParam String category,
            @RequestParam String brand) {
        try {
            List<Product> products = productService.getProductsByCategoryAndBrand(category, brand);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            return ResponseEntity.ok(new APIResponse("success", products));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/products/{name}/products")
    public ResponseEntity<APIResponse> getProductByName(@PathVariable String name) {
        try {
            List<Product> products = productService.getProductsByName(name);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            return ResponseEntity.ok(new APIResponse("success", products));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/products/by-brand")
    public ResponseEntity<APIResponse> getProductByBrand(@RequestParam String brand) {
        try {
            List<Product> products = productService.getProductsByBrand(brand);
            return ResponseEntity.ok(new APIResponse("success", products));

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("/products/by-category")
    public ResponseEntity<APIResponse> getProductByCategory(@RequestParam String category) {
        try {
            List<Product> products = productService.getProductsByCategory(category);
            if (products.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse("No product found", null));
            }
            return ResponseEntity.ok(new APIResponse("success", products));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new APIResponse(e.getMessage(), null));
        }
    }

    @GetMapping("products/count/by-brand/by-name")
    public ResponseEntity<APIResponse> countProductCountByBrandAndName(@RequestParam String brand, @RequestParam String name) {
        try {
            var products = productService.countProductsByBrandAndName(brand, name);

            return  ResponseEntity.ok(new APIResponse("success", products));
        }
        catch (Exception e) {
            return ResponseEntity.ok(new APIResponse( e.getMessage(),null));
        }
    }
}