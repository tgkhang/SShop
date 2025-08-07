package com.projectcodework.second_shops.model;

import java.math.BigDecimal;
import java.util.List;

public class Product {

    private Long id;
    private String name;
    private String brand;
    private BigDecimal price;
    private int inventory; //track number of product in stock
    private String description;


    private Category category;

    private List<Image> images;
}
