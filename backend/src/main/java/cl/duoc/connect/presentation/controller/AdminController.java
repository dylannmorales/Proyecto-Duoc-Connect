package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.UpdateEstadoRequest;
import cl.duoc.connect.application.dto.request.UpdateRolRequest;
import cl.duoc.connect.application.dto.response.AdminStatsResponse;
import cl.duoc.connect.application.dto.response.AdminUsuarioResponse;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
@Tag(name = "Administración", description = "Gestión de usuarios y roles")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas generales de la plataforma")
    public ApiResponse<AdminStatsResponse> obtenerEstadisticas() {
        return ApiResponse.ok(adminService.obtenerEstadisticas());
    }

    @GetMapping("/usuarios")
    @Operation(summary = "Listar usuarios registrados")
    public ApiResponse<PageResponse<AdminUsuarioResponse>> listarUsuarios(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarUsuarios(page, size));
    }

    @PatchMapping("/usuarios/{id}/rol")
    @Operation(summary = "Cambiar rol de un usuario")
    public ApiResponse<AdminUsuarioResponse> actualizarRol(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRolRequest request) {
        return ApiResponse.ok(adminService.actualizarRol(id, request), "Rol actualizado");
    }

    @PatchMapping("/usuarios/{id}/estado")
    @Operation(summary = "Activar o desactivar un usuario")
    public ApiResponse<AdminUsuarioResponse> actualizarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEstadoRequest request) {
        return ApiResponse.ok(adminService.actualizarEstado(id, request), "Estado actualizado");
    }
}
