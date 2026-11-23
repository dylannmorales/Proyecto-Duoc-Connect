package cl.duoc.connect.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Crea el cliente de S3 solo cuando {@code app.storage.s3.enabled=true}.
 *
 * <p>Si vienen {@code app.storage.s3.access-key} y {@code secret-key} (AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY en variables de entorno o en el .env de desarrollo) se usan esas claves.
 * Si no, se usa la cadena estándar de AWS (~/.aws/credentials, rol de la instancia, etc.).</p>
 */
@Slf4j
@Configuration
@ConditionalOnProperty(prefix = "app.storage.s3", name = "enabled", havingValue = "true")
public class S3StorageConfig {

    @Bean(destroyMethod = "close")
    public S3Client s3Client(@Value("${app.storage.s3.region}") String region,
                             @Value("${app.storage.s3.access-key:}") String accessKey,
                             @Value("${app.storage.s3.secret-key:}") String secretKey) {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials(accessKey, secretKey))
                .build();
    }

    static AwsCredentialsProvider credentials(String accessKey, String secretKey) {
        if (StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey)) {
            log.info("S3: usando las claves de AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY");
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey.trim(), secretKey.trim()));
        }
        log.info("S3: usando la cadena de credenciales por defecto de AWS (~/.aws/credentials, etc.)");
        return DefaultCredentialsProvider.create();
    }
}
