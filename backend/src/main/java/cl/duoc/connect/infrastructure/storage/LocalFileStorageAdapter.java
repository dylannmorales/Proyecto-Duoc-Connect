package cl.duoc.connect.infrastructure.storage;

import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
public class LocalFileStorageAdapter implements FileStoragePort {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final Set<String> ALLOWED_PDF_TYPES = Set.of("application/pdf");
    private static final long MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    private static final long MAX_PDF_BYTES = 10 * 1024 * 1024;

    private final Path uploadRoot;

    public LocalFileStorageAdapter(@Value("${app.upload.path}") String uploadPath) {
        this.uploadRoot = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot.resolve("profiles"));
            Files.createDirectories(uploadRoot.resolve("apuntes"));
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo crear el directorio de uploads", ex);
        }
    }

    @Override
    public String storeProfilePhoto(MultipartFile file, String previousUrl) {
        validateImage(file);

        String extension = resolveImageExtension(file);
        String filename = UUID.randomUUID() + extension;
        Path target = uploadRoot.resolve("profiles").resolve(filename);

        try {
            storeToPath(file, target);
            deletePrevious(previousUrl, "profiles");
            return "/uploads/profiles/" + filename;
        } catch (IOException ex) {
            log.error("Error al guardar foto de perfil", ex);
            throw new BusinessException("FILE_UPLOAD_ERROR", "No se pudo guardar la foto de perfil");
        }
    }

    @Override
    public String storeApuntePdf(MultipartFile file) {
        validatePdf(file);

        String filename = UUID.randomUUID() + ".pdf";
        Path target = uploadRoot.resolve("apuntes").resolve(filename);

        try {
            storeToPath(file, target);
            return "/uploads/apuntes/" + filename;
        } catch (IOException ex) {
            log.error("Error al guardar PDF de apunte", ex);
            throw new BusinessException("FILE_UPLOAD_ERROR", "No se pudo guardar el archivo PDF");
        }
    }

    @Override
    public void deleteStoredFile(String fileUrl) {
        if (!StringUtils.hasText(fileUrl) || !fileUrl.startsWith("/uploads/")) {
            return;
        }

        try {
            Path filePath = uploadRoot.resolve(fileUrl.substring("/uploads/".length())).normalize();
            if (!filePath.startsWith(uploadRoot)) {
                return;
            }
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("No se pudo eliminar el archivo: {}", fileUrl);
        }
    }

    @Override
    public Resource loadAsResource(String fileUrl) {
        if (!StringUtils.hasText(fileUrl) || !fileUrl.startsWith("/uploads/")) {
            throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
        }

        try {
            Path filePath = uploadRoot.resolve(fileUrl.substring("/uploads/".length())).normalize();
            if (!filePath.startsWith(uploadRoot)) {
                throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_EMPTY", "El archivo está vacío");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BusinessException("FILE_TOO_LARGE", "La foto no puede superar 2 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BusinessException("FILE_INVALID_TYPE", "Solo se permiten imágenes JPG, PNG o WebP");
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_EMPTY", "El archivo está vacío");
        }
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new BusinessException("FILE_TOO_LARGE", "El PDF no puede superar 10 MB");
        }
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        boolean isPdfType = contentType != null && ALLOWED_PDF_TYPES.contains(contentType);
        boolean isPdfExtension = originalName != null && originalName.toLowerCase().endsWith(".pdf");
        if (!isPdfType && !isPdfExtension) {
            throw new BusinessException("FILE_INVALID_TYPE", "Solo se permiten archivos PDF");
        }
    }

    private String resolveImageExtension(MultipartFile file) {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "foto.jpg");
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > 0) {
            return originalName.substring(dotIndex).toLowerCase();
        }
        return switch (file.getContentType()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private void storeToPath(MultipartFile file, Path target) throws IOException {
        Files.createDirectories(target.getParent());
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void deletePrevious(String previousUrl, String folder) {
        if (!StringUtils.hasText(previousUrl) || !previousUrl.startsWith("/uploads/" + folder + "/")) {
            return;
        }
        try {
            Path previous = uploadRoot.resolve(folder)
                    .resolve(previousUrl.substring(("/uploads/" + folder + "/").length()));
            Files.deleteIfExists(previous);
        } catch (IOException ex) {
            log.warn("No se pudo eliminar el archivo anterior: {}", previousUrl);
        }
    }
}
