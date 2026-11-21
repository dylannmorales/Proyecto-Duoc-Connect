package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.AdminUpdateApunteRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateGrupoRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateMensajeRequest;
import cl.duoc.connect.application.dto.request.AdminUpdatePreguntaRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateRespuestaRequest;
import cl.duoc.connect.application.dto.request.UpdateEstadoRequest;
import cl.duoc.connect.application.dto.request.UpdateRolRequest;
import cl.duoc.connect.application.dto.response.AdminApunteResponse;
import cl.duoc.connect.application.dto.response.AdminFotoPerfilResponse;
import cl.duoc.connect.application.dto.response.AdminGrupoResponse;
import cl.duoc.connect.application.dto.response.AdminMensajeResponse;
import cl.duoc.connect.application.dto.response.AdminPreguntaResponse;
import cl.duoc.connect.application.dto.response.AdminRespuestaResponse;
import cl.duoc.connect.application.dto.response.AdminStatsResponse;
import cl.duoc.connect.application.dto.response.AdminUsuarioResponse;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.ApunteDescarga;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
@Tag(name = "Administración", description = "Panel de administración y moderación")
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

    @GetMapping("/apuntes")
    @Operation(summary = "Listar apuntes para moderación")
    public ApiResponse<PageResponse<AdminApunteResponse>> listarApuntes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarApuntes(page, size));
    }

    @GetMapping("/apuntes/{id}")
    @Operation(summary = "Ver detalle de un apunte")
    public ApiResponse<AdminApunteResponse> obtenerApunte(@PathVariable UUID id) {
        return ApiResponse.ok(adminService.obtenerApunte(id));
    }

    @PatchMapping("/apuntes/{id}")
    @Operation(summary = "Editar un apunte")
    public ApiResponse<AdminApunteResponse> actualizarApunte(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateApunteRequest request) {
        return ApiResponse.ok(adminService.actualizarApunte(id, request), "Apunte actualizado");
    }

    @DeleteMapping("/apuntes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un apunte")
    public void eliminarApunte(@PathVariable UUID id) {
        adminService.eliminarApunte(id);
    }

    @GetMapping("/apuntes/{id}/descargar")
    @Operation(summary = "Descargar PDF de un apunte")
    public ResponseEntity<Resource> descargarApunte(@PathVariable UUID id) {
        ApunteDescarga descarga = adminService.descargarApunte(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(descarga.nombreArchivo(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(descarga.resource());
    }

    @GetMapping("/foro/preguntas")
    @Operation(summary = "Listar preguntas del foro para moderación")
    public ApiResponse<PageResponse<AdminPreguntaResponse>> listarPreguntas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarPreguntas(page, size));
    }

    @GetMapping("/foro/preguntas/{id}")
    @Operation(summary = "Ver detalle de una pregunta")
    public ApiResponse<AdminPreguntaResponse> obtenerPregunta(@PathVariable UUID id) {
        return ApiResponse.ok(adminService.obtenerPregunta(id));
    }

    @PatchMapping("/foro/preguntas/{id}")
    @Operation(summary = "Editar una pregunta del foro")
    public ApiResponse<AdminPreguntaResponse> actualizarPregunta(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdatePreguntaRequest request) {
        return ApiResponse.ok(adminService.actualizarPregunta(id, request), "Pregunta actualizada");
    }

    @DeleteMapping("/foro/preguntas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar una pregunta del foro")
    public void eliminarPregunta(@PathVariable UUID id) {
        adminService.eliminarPregunta(id);
    }

    @GetMapping("/foro/respuestas")
    @Operation(summary = "Listar respuestas del foro para moderación")
    public ApiResponse<PageResponse<AdminRespuestaResponse>> listarRespuestas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarRespuestas(page, size));
    }

    @PatchMapping("/foro/respuestas/{id}")
    @Operation(summary = "Editar una respuesta del foro")
    public ApiResponse<AdminRespuestaResponse> actualizarRespuesta(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateRespuestaRequest request) {
        return ApiResponse.ok(adminService.actualizarRespuesta(id, request), "Respuesta actualizada");
    }

    @DeleteMapping("/foro/respuestas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar una respuesta del foro")
    public void eliminarRespuesta(@PathVariable UUID id) {
        adminService.eliminarRespuesta(id);
    }

    @GetMapping("/grupos")
    @Operation(summary = "Listar grupos para moderación")
    public ApiResponse<PageResponse<AdminGrupoResponse>> listarGrupos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarGrupos(page, size));
    }

    @GetMapping("/grupos/{id}")
    @Operation(summary = "Ver detalle de un grupo")
    public ApiResponse<AdminGrupoResponse> obtenerGrupo(@PathVariable UUID id) {
        return ApiResponse.ok(adminService.obtenerGrupo(id));
    }

    @PatchMapping("/grupos/{id}")
    @Operation(summary = "Editar un grupo")
    public ApiResponse<AdminGrupoResponse> actualizarGrupo(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateGrupoRequest request) {
        return ApiResponse.ok(adminService.actualizarGrupo(id, request), "Grupo actualizado");
    }

    @DeleteMapping("/grupos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un grupo")
    public void eliminarGrupo(@PathVariable UUID id) {
        adminService.eliminarGrupo(id);
    }

    @GetMapping("/mensajes")
    @Operation(summary = "Listar mensajes de chat para moderación")
    public ApiResponse<PageResponse<AdminMensajeResponse>> listarMensajes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarMensajes(page, size));
    }

    @GetMapping("/mensajes/{id}")
    @Operation(summary = "Ver detalle de un mensaje")
    public ApiResponse<AdminMensajeResponse> obtenerMensaje(@PathVariable UUID id) {
        return ApiResponse.ok(adminService.obtenerMensaje(id));
    }

    @PatchMapping("/mensajes/{id}")
    @Operation(summary = "Editar un mensaje de chat")
    public ApiResponse<AdminMensajeResponse> actualizarMensaje(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateMensajeRequest request) {
        return ApiResponse.ok(adminService.actualizarMensaje(id, request), "Mensaje actualizado");
    }

    @DeleteMapping("/mensajes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un mensaje de chat")
    public void eliminarMensaje(@PathVariable UUID id) {
        adminService.eliminarMensaje(id);
    }

    @GetMapping("/fotos-perfil")
    @Operation(summary = "Listar fotos de perfil subidas")
    public ApiResponse<PageResponse<AdminFotoPerfilResponse>> listarFotosPerfil(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.listarFotosPerfil(page, size));
    }

    @DeleteMapping("/fotos-perfil/{usuarioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar foto de perfil de un usuario")
    public void eliminarFotoPerfil(@PathVariable UUID usuarioId) {
        adminService.eliminarFotoPerfil(usuarioId);
    }
}
