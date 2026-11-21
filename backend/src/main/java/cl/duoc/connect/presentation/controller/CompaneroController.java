package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.UpdatePerfilProyectoRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.CompaneroRecomendacionResponse;
import cl.duoc.connect.application.dto.response.PerfilProyectoResponse;
import cl.duoc.connect.application.service.CompaneroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companeros")
@RequiredArgsConstructor
@Tag(name = "Compañeros", description = "Búsqueda de compañeros para proyectos")
@SecurityRequirement(name = "bearerAuth")
public class CompaneroController {

    private final CompaneroService companeroService;

    @GetMapping("/perfil")
    @Operation(summary = "Obtener mi perfil de proyecto")
    public ApiResponse<PerfilProyectoResponse> obtenerPerfil() {
        return ApiResponse.ok(companeroService.obtenerMiPerfil());
    }

    @PutMapping("/perfil")
    @Operation(summary = "Actualizar mi perfil de proyecto")
    public ApiResponse<PerfilProyectoResponse> actualizarPerfil(
            @Valid @RequestBody UpdatePerfilProyectoRequest request) {
        return ApiResponse.ok(companeroService.actualizarMiPerfil(request), "Perfil actualizado");
    }

    @GetMapping("/recomendaciones")
    @Operation(summary = "Obtener compañeros recomendados")
    public ApiResponse<List<CompaneroRecomendacionResponse>> recomendaciones(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(companeroService.obtenerRecomendaciones(limit));
    }

    @GetMapping("/buscar")
    @Operation(summary = "Buscar compañeros con filtros")
    public ApiResponse<List<CompaneroRecomendacionResponse>> buscar(
            @RequestParam(required = false) UUID asignaturaId,
            @RequestParam(required = false) UUID habilidadId,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(companeroService.buscarCompaneros(asignaturaId, habilidadId, limit));
    }
}
