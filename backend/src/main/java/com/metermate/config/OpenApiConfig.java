package com.metermate.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI meterMateOpenAPI() {
        return new OpenAPI().info(new Info().title("MeterMate API").version("v1").description("MeterMate backend APIs"));
    }
}
