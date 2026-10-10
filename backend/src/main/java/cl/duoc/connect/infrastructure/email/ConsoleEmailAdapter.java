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
}
