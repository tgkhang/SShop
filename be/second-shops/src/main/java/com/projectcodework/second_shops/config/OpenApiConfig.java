package com.projectcodework.second_shops.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:9193}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        Server devServer = new Server()
                .url("http://localhost:" + serverPort)
                .description("Development server");

        Contact contact = new Contact()
                .name("Second Shops Team")
                .email("support@secondshops.com");

        License license = new License()
                .name("MIT License")
                .url("https://choosealicense.com/licenses/mit/");

        Info info = new Info()
                .title("Second Shops API")
                .version("1.0.0")
                .contact(contact)
                .description(
                        "eCommerce API for Second Shops application providing endpoints for managing products, categories, and images.")
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer));
    }
}
