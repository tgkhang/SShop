package com.projectcodework.second_shops.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ShopConfig {
    @Bean // Auto-inject model mapper when any class needed
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}

/*
    This file is configuration class use to config Bean Spring for entire application
    This is the centralized to init all shared component
 */