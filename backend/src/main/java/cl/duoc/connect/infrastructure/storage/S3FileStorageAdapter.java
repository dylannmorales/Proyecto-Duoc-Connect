package cl.duoc.connect.infrastructure.storage;

import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * Guarda los PDF de apuntes en un bucket privado de S3. Las fotos de perfil y las imágenes
 * del foro siguen en disco a través de {@link LocalFileStorageAdapter}.
 *
 * <p>La URL guardada en la base tiene la forma {@code s3://<bucket>/<clave>}. Los apuntes
 * subidos antes de activar S3 (con URL {@code /uploads/...}) se siguen leyendo desde disco.
 * La descarga pasa por el backend, así que el bucket no necesita ser público.</p>
 */
@Slf4j
@Primary
@Component
@ConditionalOnProperty(prefix = "app.storage.s3", name = "enabled", havingValue = "true")
public class S3FileStorageAdapter implements FileStoragePort {

    static final String S3_SCHEME = "s3://";

    private final S3Client s3Client;
    private final LocalFileStorageAdapter local;
    private final String bucket;
    private final String prefix;

    public S3FileStorageAdapter(S3Client s3Client,
                                LocalFileStorageAdapter local,
                                @Value("${app.storage.s3.bucket}") String bucket,
                                @Value("${app.storage.s3.prefix:apuntes/}") String prefix) {
        if (!StringUtils.hasText(bucket)) {
            throw new IllegalStateException(
                    "AWS_S3_ENABLED=true pero falta AWS_S3_BUCKET con el nombre del bucket");
        }
        this.s3Client = s3Client;
        this.local = local;
        this.bucket = bucket.trim();
        this.prefix = normalizePrefix(prefix);
        log.info("PDF de apuntes en S3: bucket={}, prefijo={}", this.bucket, this.prefix);
    }

    @Override
    public String storeApuntePdf(MultipartFile file) {
        local.validatePdf(file);

        String key = prefix + UUID.randomUUID() + ".pdf";
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("application/pdf")
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        try (InputStream in = file.getInputStream()) {
            s3Client.putObject(request, RequestBody.fromInputStream(in, file.getSize()));
            return S3_SCHEME + bucket + "/" + key;
        } catch (IOException | SdkException ex) {
            log.error("Error al subir PDF de apunte a S3 (bucket={}, clave={})", bucket, key, ex);
            throw new BusinessException("FILE_UPLOAD_ERROR", "No se pudo guardar el archivo PDF");
        }
    }

    @Override
    public Resource loadAsResource(String fileUrl) {
        if (!isS3Url(fileUrl)) {
            return local.loadAsResource(fileUrl);
        }
        S3Location location = parse(fileUrl);
        try {
            InputStream stream = s3Client.getObject(GetObjectRequest.builder()
                    .bucket(location.bucket())
                    .key(location.key())
                    .build());
            return new InputStreamResource(stream);
        } catch (NoSuchKeyException ex) {
            throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
        } catch (SdkException ex) {
            log.error("Error al leer {} desde S3", fileUrl, ex);
            throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
        }
    }

    @Override
    public void deleteStoredFile(String fileUrl) {
        if (!isS3Url(fileUrl)) {
            local.deleteStoredFile(fileUrl);
            return;
        }
        S3Location location = parse(fileUrl);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(location.bucket())
                    .key(location.key())
                    .build());
        } catch (SdkException ex) {
            log.warn("No se pudo eliminar {} de S3: {}", fileUrl, ex.getMessage());
        }
    }

    @Override
    public String storeProfilePhoto(MultipartFile file, String previousUrl) {
        return local.storeProfilePhoto(file, previousUrl);
    }

    @Override
    public String storeForoImage(MultipartFile file) {
        return local.storeForoImage(file);
    }

    private static boolean isS3Url(String fileUrl) {
        return fileUrl != null && fileUrl.startsWith(S3_SCHEME);
    }

    private static S3Location parse(String fileUrl) {
        String rest = fileUrl.substring(S3_SCHEME.length());
        int slash = rest.indexOf('/');
        if (slash <= 0 || slash == rest.length() - 1) {
            throw new BusinessException("FILE_NOT_FOUND", "Archivo no encontrado");
        }
        return new S3Location(rest.substring(0, slash), rest.substring(slash + 1));
    }

    private static String normalizePrefix(String prefix) {
        if (!StringUtils.hasText(prefix)) {
            return "";
        }
        String clean = prefix.trim().replaceAll("^/+", "");
        return clean.endsWith("/") ? clean : clean + "/";
    }

    private record S3Location(String bucket, String key) {
    }
}
