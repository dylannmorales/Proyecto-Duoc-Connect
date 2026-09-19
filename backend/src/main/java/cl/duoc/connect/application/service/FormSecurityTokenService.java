package cl.duoc.connect.application.service;

import cl.duoc.connect.domain.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FormSecurityTokenService {

    private static final Duration TTL = Duration.ofMinutes(15);
    private final Map<String, Instant> tokens = new ConcurrentHashMap<>();

    public String generateToken() {
        purgeExpired();
        String token = UUID.randomUUID().toString();
        tokens.put(token, Instant.now().plus(TTL));
        return token;
    }

    public void validateAndConsume(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BusinessException("INVALID_SECURITY_TOKEN", "Token de seguridad requerido");
        }

        purgeExpired();
        Instant expiry = tokens.remove(token.trim());
        if (expiry == null || Instant.now().isAfter(expiry)) {
            throw new BusinessException("INVALID_SECURITY_TOKEN", "Token de seguridad inválido o expirado");
        }
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, Instant>> iterator = tokens.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Instant> entry = iterator.next();
            if (now.isAfter(entry.getValue())) {
                iterator.remove();
            }
        }
    }
}
