package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.EnviarMensajeRequest;
import cl.duoc.connect.application.service.GrupoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Controller
@Validated
@RequiredArgsConstructor
public class GrupoWebSocketController {

    private final GrupoService grupoService;

    @MessageMapping("/grupos/{grupoId}/mensajes")
    public void enviarMensaje(
            @DestinationVariable UUID grupoId,
            @Valid @Payload EnviarMensajeRequest request) {
        grupoService.enviarMensaje(grupoId, request);
    }
}
