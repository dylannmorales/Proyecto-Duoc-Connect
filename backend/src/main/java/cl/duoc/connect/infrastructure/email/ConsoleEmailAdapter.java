package cl.duoc.connect.infrastructure.email;

import cl.duoc.connect.application.port.out.EmailPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ConsoleEmailAdapter implements EmailPort {

    @Override
    public void sendPasswordResetEmail(String to, String resetLink) {
        log.info("=== EMAIL DE RECUPERACIÓN (DEV) ===");
        log.info("Para: {}", to);
        log.info("Enlace: {}", resetLink);
        log.info("===================================");
    }

    @Override
    public void sendGroupInvitationEmail(
            String to, String grupoNombre, String invitadorNombre, String invitationLink, String codigo) {
        log.info("=== EMAIL DE INVITACIÓN A GRUPO (DEV) ===");
        log.info("Para: {}", to);
        log.info("Asunto: {} te invitó al grupo \"{}\" - Duoc Connect", invitadorNombre, grupoNombre);
        log.info("Enlace: {}", invitationLink);
        log.info("Código de invitación: {}", codigo);
        log.info("=========================================");
    }

    @Override
    public void sendNoteShareEmail(
            String to, String apunteTitulo, String asignaturaNombre, String remitenteNombre, String link, String mensaje) {
        log.info("=== EMAIL APUNTE COMPARTIDO (DEV) ===");
        log.info("Para: {}", to);
        log.info("Asunto: {} compartió contigo el apunte \"{}\" - Duoc Connect", remitenteNombre, apunteTitulo);
        log.info("Asignatura: {}", asignaturaNombre);
        if (mensaje != null && !mensaje.isBlank()) {
            log.info("Mensaje: {}", mensaje);
        }
        log.info("Enlace: {}", link);
        log.info("=====================================");
    }
}
