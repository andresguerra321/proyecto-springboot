package com.campus.rentaequipos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.campus.rentaequipos")
@EnableJpaRepositories(basePackages = "com.campus.rentaequipos")
public class RentaEquiposApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentaEquiposApplication.class, args);
	}

}
