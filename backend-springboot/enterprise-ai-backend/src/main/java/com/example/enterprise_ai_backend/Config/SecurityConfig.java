package com.example.enterprise_ai_backend.Config;

import com.example.enterprise_ai_backend.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {}) // allow frontend
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // Allow preflight requests (VERY IMPORTANT for React)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // Document uploads/downloads — authenticated users only
                        .requestMatchers("/api/documents/**").authenticated()

                        // Notifications — authenticated users only
                        .requestMatchers("/api/notifications/**").authenticated()

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // User endpoints — accessible by both USER and ADMIN
                        .requestMatchers("/api/user/**").authenticated()

                        // Tasks and audit — any authenticated user
                        .requestMatchers("/api/tasks/**").authenticated()
                        .requestMatchers("/api/audit/**").authenticated()

                        // Everything else
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
