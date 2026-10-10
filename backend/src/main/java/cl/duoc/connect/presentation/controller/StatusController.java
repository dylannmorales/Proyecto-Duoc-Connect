package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.AsignaturaResponse;
import cl.duoc.connect.application.dto.response.CarreraResponse;
import cl.duoc.connect.application.dto.response.SedeResponse;
import cl.duoc.connect.application.dto.response.StatusResponse;
import cl.duoc.connect.application.service.CatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Sistema", description = "Endpoints de estado y catálogos")
public class StatusController {

    private final CatalogoService catalogoService;

    @GetMapping("/status")
    @Operation(summary = "Estado de la aplicación")
    public ApiResponse<StatusResponse> status() {
        StatusResponse status = StatusResponse.builder()
                .application("Duoc Connect")
                .version("0.1.0")
                .status("UP")
                .build();
        return ApiResponse.ok(status);
    }

    @GetMapping("/catalogos/carreras")
    @Operation(summary = "Listar carreras")
    public ApiResponse<List<CarreraResponse>> listarCarreras() {
        return ApiResponse.ok(catalogoService.listarCarreras());
    }

    @GetMapping("/catalogos/sedes")
    @Operation(summary = "Listar sedes")
    public ApiResponse<List<SedeResponse>> listarSedes() {
        return ApiResponse.ok(catalogoService.listarSedes());
    }

    @GetMapping("/catalogos/asignaturas")
    @Operation(summary = "Listar asignaturas por carrera")
    public ApiResponse<List<AsignaturaResponse>> listarAsignaturas(
            @RequestParam UUID carreraId) {
        return ApiResponse.ok(catalogoService.listarAsignaturasPorCarrera(carreraId));
    }
}
