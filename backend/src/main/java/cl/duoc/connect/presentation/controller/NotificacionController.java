package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.MessageResponse;
import cl.duoc.connect.application.dto.response.NotificacionResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Alertas para usuarios (app móvil y web)")
@SecurityRequirement(name = "bearerAuth")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    @Operation(summary = "Listar notificaciones del usuario")
    public ApiResponse<PageResponse<NotificacionResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificacionService.listar(page, size));
    }

    @GetMapping("/no-leidas")
    @Operation(summary = "Contar notificaciones no leídas")
    public ApiResponse<Map<String, Long>> contarNoLeidas() {
        return ApiResponse.ok(Map.of("count", notificacionService.contarNoLeidas()));
    }

    @PatchMapping("/{id}/leida")
    @Operation(summary = "Marcar notificación como leída")
    public ApiResponse<MessageResponse> marcarLeida(@PathVariable UUID id) {
        notificacionService.marcarLeida(id);
        return ApiResponse.ok(MessageResponse.builder().message("Notificación marcada como leída").build());
    }

    @PatchMapping("/leer-todas")
    @Operation(summary = "Marcar todas las notificaciones como leídas")
    public ApiResponse<MessageResponse> marcarTodasLeidas() {
        notificacionService.marcarTodasLeidas();
        return ApiResponse.ok(MessageResponse.builder().message("Todas las notificaciones fueron leídas").build());
    }
}
