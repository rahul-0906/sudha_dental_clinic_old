package com.sudhadental.clinic.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/theme")
public class ThemeConfigController {

    @Value("${clinic.name}")
    private String clinicName;

    @Value("${clinic.primary-color}")
    private String primaryColor;

    @Value("${clinic.secondary-color}")
    private String secondaryColor;

    @Value("${clinic.email}")
    private String email;

    @Value("${clinic.phone}")
    private String phone;

    @Value("${clinic.address}")
    private String address;

    @GetMapping("/config")
    public ResponseEntity<?> getThemeConfig() {
        return ResponseEntity.ok(Map.of(
                "name", clinicName,
                "primaryColor", primaryColor,
                "secondaryColor", secondaryColor,
                "email", email,
                "phone", phone,
                "address", address
        ));
    }
}
