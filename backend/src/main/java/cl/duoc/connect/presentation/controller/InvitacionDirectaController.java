package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.InvitarCompaneroRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.GrupoInvitableResponse;
import cl.duoc.connect.application.dto.response.InvitacionDirectaResponse;
import cl.duoc.connect.application.dto.response.MessageResponse;
import cl.duoc.connect.application.dto.response.RespuestaInvitacionResponse;
import cl.duoc.connect.application.service.InvitacionDirectaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Invitaciones directas", description = "Invitar a un compañero a un grupo desde su perfil, sin su correo")
@SecurityRequirement(name = "bearerAuth")
public class InvitacionDirectaController {

    private final InvitacionDirectaService invitacionService;

    @GetMapping("/companeros/{usuarioId}/grupos-invitables")
    @Operation(summary = "Mis grupos, indicando a cuáles puedo invitar a este compañero")
    public ApiResponse<List<GrupoInvitableResponse>> gruposInvitables(@PathVariable UUID usuarioId) {
        return ApiResponse.ok(invitacionService.gruposInvitables(usuarioId));
    }

    @PostMapping("/companeros/{usuarioId}/invitaciones")
    @Operation(summary = "Invitar a un compañero a uno de mis grupos")
    public ApiResponse<MessageResponse> invitar(
            @PathVariable UUID usuarioId,
            @Valid @RequestBody InvitarCompaneroRequest request) {
        invitacionService.invitar(usuarioId, request);
        return ApiResponse.ok(MessageResponse.builder().message("Invitación enviada").build());
    }

    @GetMapping("/invitaciones")
    @Operation(summary = "Invitaciones pendientes que recibí")
    public ApiResponse<List<InvitacionDirectaResponse>> recibidas() {
        return ApiResponse.ok(invitacionService.listarRecibidas());
    }

    @PostMapping("/invitaciones/{id}/aceptar")
    @Operation(summary = "Aceptar una invitación y unirse al grupo")
    public ApiResponse<RespuestaInvitacionResponse> aceptar(@PathVariable UUID id) {
        return ApiResponse.ok(invitacionService.aceptar(id), "Te uniste al grupo");
    }

    @PostMapping("/invitaciones/{id}/rechazar")
    @Operation(summary = "Rechazar una invitación")
    public ApiResponse<RespuestaInvitacionResponse> rechazar(@PathVariable UUID id) {
        return ApiResponse.ok(invitacionService.rechazar(id), "Invitación rechazada");
    }
}
