package com.campus.rentaequipos.catalog.infrastructure.adapter.in.web;

import com.campus.rentaequipos.catalog.application.dto.CategoryResponse;
import com.campus.rentaequipos.catalog.application.dto.ToolRequest;
import com.campus.rentaequipos.catalog.application.dto.ToolResponse;
import com.campus.rentaequipos.catalog.application.usecase.ToolUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tools")
@Tag(name = "Catalog", description = "Tool Catalog Management APIs")
public class ToolController {

    private final ToolUseCase toolUseCase;
    private final com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard ownershipGuard;

    public ToolController(ToolUseCase toolUseCase,
                          com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard ownershipGuard) {
        this.toolUseCase = toolUseCase;
        this.ownershipGuard = ownershipGuard;
    }

    @GetMapping
    @Operation(summary = "Get tools with filters", description = "Retrieves tools filtered by category, provider, status or search keyword")
    public ResponseEntity<List<ToolResponse>> getTools(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID providerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        if (categoryId != null || providerId != null || status != null || search != null) {
            return ResponseEntity.ok(toolUseCase.getTools(categoryId, providerId, status, search));
        }
        return ResponseEntity.ok(toolUseCase.getAllTools());
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all categories", description = "Retrieves a list of all tool categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(toolUseCase.getAllCategories());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a tool by ID", description = "Retrieves a specific tool by its ID")
    public ResponseEntity<ToolResponse> getToolById(@PathVariable UUID id) {
        return ResponseEntity.ok(toolUseCase.getToolById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Register a new tool", description = "Registers a new tool in the catalog (Requires PROVEEDOR or ADMIN role)")
    public ResponseEntity<ToolResponse> registerTool(
            @RequestBody ToolRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ToolRequest effective = request;
        if (!ownershipGuard.isAdmin(userDetails)) {
            // Un proveedor SIEMPRE registra bajo su propio perfil (ignora providerId enviado por el cliente)
            UUID ownProviderId = ownershipGuard.findOwnProviderId(userDetails);
            if (ownProviderId == null) {
                throw new org.springframework.security.access.AccessDeniedException("Su cuenta no tiene un perfil de proveedor asociado");
            }
            effective = new ToolRequest(ownProviderId, request.categoryId(), request.name(), request.brand(),
                    request.model(), request.serialNumber(), request.description(), request.dailyPrice(),
                    request.replacementValue(), request.images(), request.specifications());
        }
        ToolResponse response = toolUseCase.registerTool(effective);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a tool", description = "Updates an existing tool in the catalog (Requires PROVEEDOR or ADMIN role)")
    public ResponseEntity<ToolResponse> updateTool(@PathVariable UUID id, @RequestBody ToolRequest request,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        ownershipGuard.assertOwnsTool(id, userDetails);
        ToolRequest effective = request;
        if (!ownershipGuard.isAdmin(userDetails)) {
            // Impide transferir la herramienta a otro proveedor
            effective = new ToolRequest(ownershipGuard.findOwnProviderId(userDetails), request.categoryId(), request.name(),
                    request.brand(), request.model(), request.serialNumber(), request.description(), request.dailyPrice(),
                    request.replacementValue(), request.status(), request.images(), request.specifications());
        }
        ToolResponse response = toolUseCase.updateTool(id, effective);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar estado de disponibilidad", description = "Cambia el estado de una herramienta (AVAILABLE o MAINTENANCE)")
    public ResponseEntity<ToolResponse> updateStatus(@PathVariable UUID id,
                                                    @RequestBody java.util.Map<String, String> body,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        ownershipGuard.assertOwnsTool(id, userDetails);
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("El campo 'status' es obligatorio");
        }
        com.campus.rentaequipos.catalog.domain.model.ToolStatus newStatus =
                com.campus.rentaequipos.catalog.domain.model.ToolStatus.valueOf(statusStr.toUpperCase());
        if (newStatus != com.campus.rentaequipos.catalog.domain.model.ToolStatus.AVAILABLE &&
            newStatus != com.campus.rentaequipos.catalog.domain.model.ToolStatus.MAINTENANCE) {
            throw new IllegalArgumentException("Solo se permite cambiar a estado AVAILABLE o MAINTENANCE");
        }
        return ResponseEntity.ok(toolUseCase.updateToolStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a tool", description = "Deletes a tool from the catalog (Requires PROVEEDOR or ADMIN role)")
    public ResponseEntity<Void> deleteTool(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        ownershipGuard.assertOwnsTool(id, userDetails);
        toolUseCase.deleteTool(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Asociar imagen a una herramienta", description = "Agrega una imagen por URL a una herramienta existente")
    public ResponseEntity<ToolResponse> addImage(
            @PathVariable UUID id,
            @RequestBody ToolRequest.ImageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ownershipGuard.assertOwnsTool(id, userDetails);
        return ResponseEntity.ok(toolUseCase.addImageToTool(id, request.imageUrl(), request.isPrimary()));
    }

    @PostMapping(value = "/{id}/images/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Subir archivo de imagen para herramienta", description = "Sube un archivo de imagen en formato multipart y lo asocia a la herramienta")
    public ResponseEntity<ToolResponse> uploadImage(
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") boolean isPrimary,
            @AuthenticationPrincipal UserDetails userDetails) {
        ownershipGuard.assertOwnsTool(id, userDetails);
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen no puede estar vacío");
        }

        // 1. Validación estricta de Content-Type MIME (Mitigación Stored XSS por archivos SVG/HTML embebidos)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/") || contentType.contains("svg") || contentType.contains("html")) {
            throw new IllegalArgumentException("Formato no permitido. Solo se admiten imágenes válidas (JPEG, PNG, WEBP). Se rechazan archivos SVG/HTML para prevenir Stored XSS.");
        }

        // 2. Sanitización estricta de nombre de archivo y verificación de extensión
        String rawOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "tool.jpg";
        String cleanBaseName = java.nio.file.Paths.get(rawOriginal).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
        String lowerExt = cleanBaseName.toLowerCase();
        if (!lowerExt.endsWith(".jpg") && !lowerExt.endsWith(".jpeg") && !lowerExt.endsWith(".png") && !lowerExt.endsWith(".webp")) {
            throw new IllegalArgumentException("Extensión de archivo no permitida. Formatos admitidos: .jpg, .jpeg, .png, .webp");
        }

        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads").toAbsolutePath().normalize();
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }
            String fileName = UUID.randomUUID() + "_" + cleanBaseName;
            java.nio.file.Path targetPath = uploadDir.resolve(fileName).normalize();

            // 3. Mitigación contra Path Traversal
            if (!targetPath.startsWith(uploadDir)) {
                throw new SecurityException("Intento de Path Traversal detectado en el nombre del archivo");
            }
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + fileName;
            return ResponseEntity.ok(toolUseCase.addImageToTool(id, fileUrl, isPrimary));
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error al guardar la imagen en el servidor: " + e.getMessage(), e);
        }
    }
}
