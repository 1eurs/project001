package com.cafeqr.common.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.filter.ShallowEtagHeaderFilter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

/** Serves locally-stored uploads under {@code /files/**}. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;

    public WebConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(appProperties.storage().localDir()).toAbsolutePath().normalize();
        registry.addResourceHandler("/files/**")
                .addResourceLocations(uploadDir.toUri().toString())
                // Filenames are random UUIDs, so a URL's content never changes — safe to
                // cache forever in browsers and at the Cloudflare edge.
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    }

    /**
     * ETags for the public menu/venue JSON so browsers and the CDN can revalidate with a
     * 304 instead of re-downloading. Scoped to paths with no streaming responses —
     * {@code /api/public/orders/**} (SSE) must stay out, the filter buffers bodies.
     */
    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> publicMenuEtagFilter() {
        var registration = new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        registration.addUrlPatterns("/api/public/restaurants/*", "/api/public/qr/*");
        return registration;
    }
}
