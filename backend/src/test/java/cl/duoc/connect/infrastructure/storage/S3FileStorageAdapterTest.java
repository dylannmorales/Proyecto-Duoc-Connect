package cl.duoc.connect.infrastructure.storage;

import cl.duoc.connect.domain.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class S3FileStorageAdapterTest {

    private static final byte[] PDF = "%PDF-1.4 contenido".getBytes(StandardCharsets.US_ASCII);

    @TempDir
    Path dir;

    private S3Client s3;
    private LocalFileStorageAdapter local;
    private S3FileStorageAdapter adapter;

    @BeforeEach
    void setUp() {
        s3 = mock(S3Client.class);
        local = new LocalFileStorageAdapter(dir.toString());
        adapter = new S3FileStorageAdapter(s3, local, "mi-bucket", "/apuntes");
    }

    @Test
    void subePdfAlBucketYDevuelveUrlS3() {
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        String url = adapter.storeApuntePdf(
                new MockMultipartFile("archivo", "clase.pdf", "application/pdf", PDF));

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(captor.capture(), any(RequestBody.class));
        PutObjectRequest request = captor.getValue();
        assertThat(request.bucket()).isEqualTo("mi-bucket");
        assertThat(request.key()).startsWith("apuntes/").endsWith(".pdf");
        assertThat(request.contentType()).isEqualTo("application/pdf");
        assertThat(url).isEqualTo("s3://mi-bucket/" + request.key());
    }

    @Test
    void rechazaArchivoQueNoEsPdfSinLlamarAS3() {
        MockMultipartFile falso = new MockMultipartFile(
                "archivo", "virus.pdf", "application/pdf", "MZ...".getBytes(StandardCharsets.US_ASCII));

        assertThatThrownBy(() -> adapter.storeApuntePdf(falso))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PDF válido");
        verify(s3, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void descargaDesdeS3() throws Exception {
        ResponseInputStream<GetObjectResponse> stream = new ResponseInputStream<>(
                GetObjectResponse.builder().build(),
                AbortableInputStream.create(new ByteArrayInputStream(PDF)));
        when(s3.getObject(any(GetObjectRequest.class))).thenReturn(stream);

        Resource resource = adapter.loadAsResource("s3://mi-bucket/apuntes/a.pdf");

        assertThat(resource.getInputStream().readAllBytes()).isEqualTo(PDF);
        ArgumentCaptor<GetObjectRequest> captor = ArgumentCaptor.forClass(GetObjectRequest.class);
        verify(s3).getObject(captor.capture());
        assertThat(captor.getValue().bucket()).isEqualTo("mi-bucket");
        assertThat(captor.getValue().key()).isEqualTo("apuntes/a.pdf");
    }

    @Test
    void objetoInexistenteEsArchivoNoEncontrado() {
        when(s3.getObject(any(GetObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("no existe").build());

        assertThatThrownBy(() -> adapter.loadAsResource("s3://mi-bucket/apuntes/x.pdf"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Archivo no encontrado");
    }

    @Test
    void apuntesAntiguosEnDiscoSiguenFuncionando() throws Exception {
        String url = local.storeApuntePdf(
                new MockMultipartFile("archivo", "viejo.pdf", "application/pdf", PDF));

        try (var in = adapter.loadAsResource(url).getInputStream()) {
            assertThat(in.readAllBytes()).isEqualTo(PDF);
        }
        verify(s3, never()).getObject(any(GetObjectRequest.class));
    }

    @Test
    void eliminaObjetoDeS3() {
        adapter.deleteStoredFile("s3://mi-bucket/apuntes/a.pdf");

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3).deleteObject(captor.capture());
        assertThat(captor.getValue().key()).isEqualTo("apuntes/a.pdf");
    }

    @Test
    void exigeNombreDeBucket() {
        assertThatThrownBy(() -> new S3FileStorageAdapter(s3, local, " ", "apuntes/"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AWS_S3_BUCKET");
    }
}
