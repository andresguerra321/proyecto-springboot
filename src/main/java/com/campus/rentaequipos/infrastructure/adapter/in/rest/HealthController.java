package com.campus.rentaequipos.infrastructure.adapter.in.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "Endpoints de verificación de estado y conectividad")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verificar estado del servicio", description = "Retorna el estado actual del API y timestamp del sistema")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "renta-equipos-api",
                "timestamp", LocalDateTime.now(),
                "database", "PostgreSQL",
                "security", "Spring Security + JWT"
        ));
    }
}
