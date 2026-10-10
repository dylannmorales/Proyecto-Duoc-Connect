package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.ApunteResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.service.ApunteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apuntes")
@RequiredArgsConstructor
@Tag(name = "Apuntes", description = "Banco de apuntes académicos")
@SecurityRequirement(name = "bearerAuth")
public class ApunteController {

    private final ApunteService apunteService;

    @GetMapping
    @Operation(summary = "Buscar apuntes")
    public ApiResponse<PageResponse<ApunteResponse>> buscarApuntes(
            @RequestParam(required = false) UUID carreraId,
            @RequestParam(required = false) UUID asignaturaId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(apunteService.buscarApuntes(carreraId, asignaturaId, q, page, size));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Subir apunte PDF")
    public ApiResponse<ApunteResponse> subirApunte(
            @RequestParam("file") MultipartFile file,
            @RequestParam("titulo") String titulo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("carreraId") UUID carreraId,
            @RequestParam("asignaturaId") UUID asignaturaId) {
        return ApiResponse.ok(
                apunteService.subirApunte(titulo, descripcion, carreraId, asignaturaId, file),
                "Apunte subido exitosamente");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un apunte")
    public ApiResponse<ApunteResponse> obtenerApunte(@PathVariable UUID id) {
        return ApiResponse.ok(apunteService.obtenerApunte(id));
    }
}
