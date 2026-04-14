package com.example.enterprise_ai_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class EnterpriseAiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnterpriseAiBackendApplication.class, args);
	}


}
