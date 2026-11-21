package cl.duoc.connect.infrastructure;

import cl.duoc.connect.application.dto.response.ApiErrorResponse;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.config.JwtProperties;
import cl.duoc.connect.infrastructure.email.ConsoleEmailAdapter;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.security.CustomUserDetailsService;
import cl.duoc.connect.infrastructure.security.JwtAuthFilter;
import cl.duoc.connect.infrastructure.security.JwtTokenProvider;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import cl.duoc.connect.infrastructure.storage.LocalFileStorageAdapter;
import cl.duoc.connect.presentation.exception.GlobalExceptionHandler;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Seguridad (JWT), manejo de errores de la API, almacenamiento de archivos y correo de desarrollo. */
class InfraestructuraTest {

    private static JwtTokenProvider jwt(String secret, long accessMs) {
        JwtProperties props = new JwtProperties();
        props.setSecret(secret);
        props.setAccessExpirationMs(accessMs);
        props.setRefreshExpirationMs(604_800_000);
        return new JwtTokenProvider(props);
    }

    @Nested
    @DisplayName("Tokens JWT")
    class Tokens {

        private final JwtTokenProvider jwt = jwt("clave-de-prueba-para-tokens-jwt-de-32-caracteres-o-mas", 900_000);

        @Test
        @DisplayName("El access token lleva el id y el correo del usuario")
        void accessToken() {
            UUID id = UUID.randomUUID();
            String token = jwt.generateAccessToken(id, "camila@duocuc.cl");
            assertThat(jwt.validateToken(token)).isTrue();
            assertThat(jwt.isAccessToken(token)).isTrue();
            assertThat(jwt.isRefreshToken(token)).isFalse();
            assertThat(jwt.extractUserId(token)).isEqualTo(id);
            assertThat(jwt.extractEmail(token)).isEqualTo("camila@duocuc.cl");
        }

        @Test
        @DisplayName("Rechaza tokens firmados con otra clave, expirados o mal formados")
        void tokensInvalidos() {
            String ajeno = jwt("otra-clave-distinta-para-firmar-tokens-de-32-caracteres", 900_000)
                    .generateAccessToken(UUID.randomUUID(), "x@duocuc.cl");
            String expirado = jwt("clave-de-prueba-para-tokens-jwt-de-32-caracteres-o-mas", -1_000)
                    .generateAccessToken(UUID.randomUUID(), "x@duocuc.cl");

            assertThat(jwt.validateToken(ajeno)).isFalse();
            assertThat(jwt.validateToken(expirado)).isFalse();
            assertThat(jwt.validateToken("abc.def.ghi")).isFalse();
            assertThat(jwt.validateToken("")).isFalse();
        }
    }

    @Nested
    @DisplayName("Filtro de autenticación JWT")
    class Filtro {

        private final JwtTokenProvider jwt = jwt("clave-de-prueba-para-tokens-jwt-de-32-caracteres-o-mas", 900_000);
        private final CustomUserDetailsService userDetails = mock(CustomUserDetailsService.class);
        private final JwtAuthFilter filter = new JwtAuthFilter(jwt, userDetails);
        private UsuarioEntity usuario;

        @BeforeEach
        void setUp() {
            usuario = TestData.usuario("Camila Rojas");
            when(userDetails.loadUserByUsername(usuario.getEmail())).thenAnswer(i -> new UserPrincipal(usuario));
        }

        @AfterEach
        void limpiar() {
            SecurityContextHolder.clearContext();
        }

        private boolean autentica(String header) throws Exception {
            SecurityContextHolder.clearContext();
            MockHttpServletRequest req = new MockHttpServletRequest();
            if (header != null) req.addHeader("Authorization", header);
            MockFilterChain chain = new MockFilterChain();
            filter.doFilter(req, new MockHttpServletResponse(), chain);
            assertThat(chain.getRequest()).isNotNull();
            return SecurityContextHolder.getContext().getAuthentication() != null;
        }

        @Test
        @DisplayName("Un access token válido autentica la petición")
        void tokenValido() throws Exception {
            assertThat(autentica("Bearer " + jwt.generateAccessToken(usuario.getId(), usuario.getEmail()))).isTrue();
        }

        @Test
        @DisplayName("Sin token, con refresh token o con otro esquema no autentica")
        void sinAutenticacion() throws Exception {
            assertThat(autentica(null)).isFalse();
            assertThat(autentica("Basic abc")).isFalse();
            assertThat(autentica("Bearer " + jwt.generateRefreshToken(usuario.getId(), usuario.getEmail()))).isFalse();
        }

        @Test
        @DisplayName("Un usuario desactivado pierde el acceso aunque su token siga vigente (DEF-10)")
        void usuarioDesactivado() throws Exception {
            String token = jwt.generateAccessToken(usuario.getId(), usuario.getEmail());
            usuario.setActivo(false);
            assertThat(autentica("Bearer " + token)).isFalse();
        }

        @Test
        @DisplayName("Un usuario eliminado no se autentica")
        void usuarioEliminado() throws Exception {
            when(userDetails.loadUserByUsername("borrado@duocuc.cl")).thenThrow(new UsernameNotFoundException("x"));
            assertThat(autentica("Bearer " + jwt.generateAccessToken(UUID.randomUUID(), "borrado@duocuc.cl"))).isFalse();
        }
    }

    @Nested
    @DisplayName("Respuestas de error de la API")
    class Errores {

        private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

        @ParameterizedTest(name = "{0} -> {1}")
        @CsvSource({
                "EMAIL_EXISTS, 400", "ASIGNATURA_INVALID, 400", "FILE_NOT_FOUND, 404", "USER_INACTIVE, 401",
                "NOT_MEMBER, 403", "ACCEPT_FORBIDDEN, 403", "SEDE_NOT_FOUND, 404", "GROUP_FULL, 409", "OTRO_CODIGO, 400"
        })
        @DisplayName("Cada código de negocio se traduce al estado HTTP correcto")
        void codigosDeNegocio(String code, int status) {
            ResponseEntity<ApiErrorResponse> r = handler.handleBusiness(new BusinessException(code, "msg"));
            assertThat(r.getStatusCode().value()).isEqualTo(status);
            assertThat(r.getBody().getError().getCode()).isEqualTo(code);
            assertThat(r.getBody().isSuccess()).isFalse();
        }

        @Test
        @DisplayName("Errores de entrada responden 400 en vez de 500 (DEF-08)")
        void erroresDeEntrada() throws Exception {
            assertThat(handler.handleMissingParam(new MissingServletRequestParameterException("carreraId", "UUID"))
                    .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(handler.handleNotReadable(new HttpMessageNotReadableException("x",
                    new MockHttpInputMessage(new byte[0]))).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(handler.handleMissingPart(new MissingServletRequestPartException("archivo"))
                    .getBody().getError().getMessage()).contains("archivo");
            assertThat(handler.handleMaxUpload(new MaxUploadSizeExceededException(10)).getBody().getError().getCode())
                    .isEqualTo("FILE_TOO_LARGE");
            assertThat(handler.handleMultipart(new MultipartException("x")).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

            BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "req");
            binding.addError(new org.springframework.validation.FieldError("req", "email", "Debe ser @duocuc.cl"));
            MethodParameter param = new MethodParameter(Object.class.getMethod("toString"), -1);
            ResponseEntity<ApiErrorResponse> validacion = handler.handleValidation(new MethodArgumentNotValidException(param, binding));
            assertThat(validacion.getBody().getError().getDetails()).singleElement()
                    .satisfies(f -> assertThat(f.getField()).isEqualTo("email"));
        }

        @Test
        @DisplayName("Autenticación, permisos, métodos y errores inesperados")
        void otrosErrores() {
            assertThat(handler.handleNotFound(new EntityNotFoundException("x")).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(handler.handleBadCredentials(new BadCredentialsException("x")).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(handler.handleDisabled(new DisabledException("x")).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(handler.handleAccessDenied(new AccessDeniedException("x")).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(handler.handleMediaType(new HttpMediaTypeNotSupportedException("x")).getStatusCode())
                    .isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
            assertThat(handler.handleMethod(new HttpRequestMethodNotSupportedException("PATCH")).getStatusCode())
                    .isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
            assertThat(handler.handleGeneric(new RuntimeException("x")).getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Nested
    @DisplayName("Almacenamiento de archivos")
    class Archivos {

        @TempDir Path dir;
        private LocalFileStorageAdapter storage;

        @BeforeEach
        void setUp() {
            storage = new LocalFileStorageAdapter(dir.toString());
        }

        private static final byte[] PDF = "%PDF-1.4\n%contenido".getBytes(StandardCharsets.US_ASCII);

        @Test
        @DisplayName("Guarda un PDF válido, lo vuelve a leer y lo elimina")
        void pdfValido() {
            String url = storage.storeApuntePdf(new MockMultipartFile("file", "resumen.pdf", "application/pdf", PDF));

            assertThat(url).startsWith("/uploads/apuntes/").endsWith(".pdf");
            assertThat(storage.loadAsResource(url).exists()).isTrue();
            storage.deleteStoredFile(url);
            assertThatThrownBy(() -> storage.loadAsResource(url)).extracting("code").isEqualTo("FILE_NOT_FOUND");
        }

        @Test
        @DisplayName("Rechaza un archivo que dice ser PDF pero no lo es (DEF-06), uno vacío y uno de otro tipo")
        void pdfInvalido() {
            assertThatThrownBy(() -> storage.storeApuntePdf(new MockMultipartFile("file", "falso.pdf", "application/pdf",
                    "no soy un pdf".getBytes()))).extracting("code").isEqualTo("FILE_INVALID_TYPE");
            assertThatThrownBy(() -> storage.storeApuntePdf(new MockMultipartFile("file", "v.pdf", "application/pdf", new byte[0])))
                    .extracting("code").isEqualTo("FILE_EMPTY");
            assertThatThrownBy(() -> storage.storeApuntePdf(new MockMultipartFile("file", "a.docx", "application/msword", PDF)))
                    .extracting("code").isEqualTo("FILE_INVALID_TYPE");
            assertThatThrownBy(() -> storage.storeApuntePdf(new MockMultipartFile("file", "g.pdf", "application/pdf",
                    new byte[10 * 1024 * 1024 + 1]))).extracting("code").isEqualTo("FILE_TOO_LARGE");
        }

        @Test
        @DisplayName("Reemplaza la foto de perfil y borra la anterior")
        void fotoPerfil() throws Exception {
            String primera = storage.storeProfilePhoto(new MockMultipartFile("f", "a.png", "image/png", new byte[]{1}), null);
            String segunda = storage.storeProfilePhoto(new MockMultipartFile("f", "sin-extension", "image/webp", new byte[]{2}), primera);

            assertThat(segunda).endsWith(".webp");
            assertThat(Files.exists(dir.resolve(primera.substring("/uploads/".length())))).isFalse();
            assertThat(storage.storeForoImage(new MockMultipartFile("f", "c.jpg", "image/jpeg", new byte[]{3}))).startsWith("/uploads/foro/");
        }

        @Test
        @DisplayName("Valida tipo y tamaño de imágenes")
        void imagenInvalida() {
            assertThatThrownBy(() -> storage.storeForoImage(new MockMultipartFile("f", "a.gif", "image/gif", new byte[]{1})))
                    .extracting("code").isEqualTo("FILE_INVALID_TYPE");
            assertThatThrownBy(() -> storage.storeProfilePhoto(new MockMultipartFile("f", "a.png", "image/png",
                    new byte[2 * 1024 * 1024 + 1]), null)).extracting("code").isEqualTo("FILE_TOO_LARGE");
            assertThatThrownBy(() -> storage.storeProfilePhoto(null, null)).extracting("code").isEqualTo("FILE_EMPTY");
        }

        @Test
        @DisplayName("No permite leer ni borrar fuera de la carpeta de uploads")
        void rutasFuera() {
            assertThatThrownBy(() -> storage.loadAsResource("/uploads/../../etc/passwd")).extracting("code").isEqualTo("FILE_NOT_FOUND");
            assertThatThrownBy(() -> storage.loadAsResource("/otra/ruta")).extracting("code").isEqualTo("FILE_NOT_FOUND");
            storage.deleteStoredFile("/uploads/../../etc/passwd");
            storage.deleteStoredFile(null);
        }
    }

    @Test
    @DisplayName("El correo de desarrollo se escribe en el log sin fallar")
    void correoDesarrollo() {
        ConsoleEmailAdapter email = new ConsoleEmailAdapter();
        email.sendPasswordResetEmail("a@duocuc.cl", "http://x");
        email.sendGroupInvitationEmail("a@duocuc.cl", "Grupo", "Camila", "http://x", "ABC123");
        email.sendNoteShareEmail("a@duocuc.cl", "Resumen", "BD", "Camila", "http://x", "Mira esto");
        email.sendNoteShareEmail("a@duocuc.cl", "Resumen", "BD", "Camila", "http://x", " ");
    }
}
