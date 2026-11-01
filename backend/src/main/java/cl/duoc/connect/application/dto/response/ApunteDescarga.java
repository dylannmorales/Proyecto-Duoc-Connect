package cl.duoc.connect.application.dto.response;

import org.springframework.core.io.Resource;

public record ApunteDescarga(Resource resource, String nombreArchivo) {
}
