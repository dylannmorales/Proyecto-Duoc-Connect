package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.CreateGrupoRequest;
import cl.duoc.connect.application.dto.request.EnviarMensajeRequest;
import cl.duoc.connect.application.dto.request.UnirseGrupoRequest;
import cl.duoc.connect.application.dto.request.UnirsePorCodigoRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.GrupoResponse;
import cl.duoc.connect.application.dto.response.MensajeGrupoResponse;
import cl.duoc.connect.application.dto.response.MiembroGrupoResponse;
import cl.duoc.connect.application.dto.response.MessageResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.service.GrupoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/grupos")
@RequiredArgsConstructor
@Tag(name = "Grupos de estudio", description = "Gestión de grupos y mensajería")
@SecurityRequirement(name = "bearerAuth")
public class GrupoController {

    private final GrupoService grupoService;

    @GetMapping
    @Operation(summary = "Buscar grupos de estudio")
    public ApiResponse<PageResponse<GrupoResponse>> buscarGrupos(
            @RequestParam(required = false) UUID carreraId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(grupoService.buscarGrupos(carreraId, q, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear grupo de estudio")
    public ApiResponse<GrupoResponse> crearGrupo(@Valid @RequestBody CreateGrupoRequest request) {
        return ApiResponse.ok(grupoService.crearGrupo(request), "Grupo creado exitosamente");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un grupo")
    public ApiResponse<GrupoResponse> obtenerGrupo(@PathVariable UUID id) {
        return ApiResponse.ok(grupoService.obtenerGrupo(id));
    }

    @GetMapping("/codigo/{codigo}")
    @Operation(summary = "Buscar grupo por código de invitación")
    public ApiResponse<GrupoResponse> buscarPorCodigo(@PathVariable String codigo) {
        return ApiResponse.ok(grupoService.buscarPorCodigo(codigo));
    }

    @PostMapping("/unirse-por-codigo")
    @Operation(summary = "Unirse a un grupo público o privado mediante código")
    public ApiResponse<GrupoResponse> unirsePorCodigo(@Valid @RequestBody UnirsePorCodigoRequest request) {
        return ApiResponse.ok(grupoService.unirsePorCodigo(request.getCodigoInvitacion()), "Te has unido al grupo");
    }

    @PostMapping("/{id}/unirse")
    @Operation(summary = "Unirse a un grupo")
    public ApiResponse<GrupoResponse> unirseGrupo(
            @PathVariable UUID id,
            @RequestBody(required = false) UnirseGrupoRequest request) {
        return ApiResponse.ok(grupoService.unirseGrupo(id, request), "Te has unido al grupo");
    }

    @DeleteMapping("/{id}/salir")
    @Operation(summary = "Salir de un grupo")
    public ApiResponse<MessageResponse> salirGrupo(@PathVariable UUID id) {
        grupoService.salirGrupo(id);
        return ApiResponse.ok(MessageResponse.builder().message("Has salido del grupo").build());
    }

    @GetMapping("/{id}/miembros")
    @Operation(summary = "Listar miembros del grupo")
    public ApiResponse<List<MiembroGrupoResponse>> listarMiembros(@PathVariable UUID id) {
        return ApiResponse.ok(grupoService.listarMiembros(id));
    }

    @GetMapping("/{id}/mensajes")
    @Operation(summary = "Listar mensajes del grupo")
    public ApiResponse<PageResponse<MensajeGrupoResponse>> listarMensajes(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(grupoService.listarMensajes(id, page, size));
    }

    @PostMapping("/{id}/mensajes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enviar mensaje al grupo")
    public ApiResponse<MensajeGrupoResponse> enviarMensaje(
            @PathVariable UUID id,
            @Valid @RequestBody EnviarMensajeRequest request) {
        return ApiResponse.ok(grupoService.enviarMensaje(id, request), "Mensaje enviado");
    }
}
