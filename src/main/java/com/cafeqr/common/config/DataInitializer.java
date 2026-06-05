package com.cafeqr.common.config;

import com.cafeqr.users.domain.Role;
import com.cafeqr.users.domain.User;
import com.cafeqr.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds an initial platform admin on startup when {@code app.bootstrap.enabled=true}
 * (dev profile only) and no platform admin yet exists.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AppProperties appProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.Bootstrap bootstrap = appProperties.bootstrap();
        if (bootstrap == null || !bootstrap.enabled()) {
            return;
        }
        if (userRepository.existsByRole(Role.PLATFORM_ADMIN)) {
            return;
        }

        User admin = new User();
        admin.setFullName(bootstrap.adminFullName());
        admin.setEmail(bootstrap.adminEmail());
        admin.setPasswordHash(passwordEncoder.encode(bootstrap.adminPassword()));
        admin.setRole(Role.PLATFORM_ADMIN);
        admin.setActive(true);
        userRepository.save(admin);

        log.warn("Seeded initial PLATFORM_ADMIN '{}'. Change this password immediately.", bootstrap.adminEmail());
    }
}
