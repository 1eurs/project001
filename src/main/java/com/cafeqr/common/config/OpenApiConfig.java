package com.cafeqr.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI cafeQrOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("CafeQR API")
                        .description("Backend for a QR-based cafe ordering platform (Oman / OMR).")
                        .version("v1")
                        .contact(new Contact().name("CafeQR").email("support@cafeqr.local"))
                        .license(new License().name("Proprietary")))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT access token. Obtain via POST /api/auth/login.")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
