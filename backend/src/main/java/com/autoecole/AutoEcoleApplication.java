package com.autoecole;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AutoEcoleApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoEcoleApplication.class, args);
    }
}
