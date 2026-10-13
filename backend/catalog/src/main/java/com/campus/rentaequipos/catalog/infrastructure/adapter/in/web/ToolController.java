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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tools")
@Tag(name = "Catalog", description = "Tool Catalog Management APIs")
public class ToolController {

    private final ToolUseCase toolUseCase;

    public ToolController(ToolUseCase toolUseCase) {
        this.toolUseCase = toolUseCase;
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
    public ResponseEntity<ToolResponse> registerTool(@RequestBody ToolRequest request) {
        ToolResponse response = toolUseCase.registerTool(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a tool", description = "Updates an existing tool in the catalog (Requires PROVEEDOR or ADMIN role)")
    public ResponseEntity<ToolResponse> updateTool(@PathVariable UUID id, @RequestBody ToolRequest request) {
        ToolResponse response = toolUseCase.updateTool(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVEEDOR') or hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a tool", description = "Deletes a tool from the catalog (Requires PROVEEDOR or ADMIN role)")
    public ResponseEntity<Void> deleteTool(@PathVariable UUID id) {
        toolUseCase.deleteTool(id);
        return ResponseEntity.noContent().build();
    }
}
