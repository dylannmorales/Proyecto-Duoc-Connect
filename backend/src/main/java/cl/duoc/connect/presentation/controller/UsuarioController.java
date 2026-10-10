package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.UpdateProfileRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.UsuarioResponse;
import cl.duoc.connect.application.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de perfiles")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/me")
    @Operation(summary = "Obtener perfil del usuario autenticado")
    public ApiResponse<UsuarioResponse> obtenerPerfilActual() {
        return ApiResponse.ok(usuarioService.obtenerPerfilActual());
    }

    @PutMapping("/me")
    @Operation(summary = "Actualizar perfil del usuario autenticado")
    public ApiResponse<UsuarioResponse> actualizarPerfil(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(usuarioService.actualizarPerfil(request), "Perfil actualizado");
    }

    @PostMapping(value = "/me/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir foto de perfil")
    public ApiResponse<UsuarioResponse> actualizarFoto(@RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(usuarioService.actualizarFoto(file), "Foto actualizada");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil público de un usuario")
    public ApiResponse<UsuarioResponse> obtenerPerfilPublico(@PathVariable UUID id) {
        return ApiResponse.ok(usuarioService.obtenerPerfilPublico(id));
    }
}
