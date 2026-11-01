package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.CrearPreguntaRequest;
import cl.duoc.connect.application.dto.response.PreguntaResponse;
import cl.duoc.connect.application.dto.response.RespuestaResponse;
import cl.duoc.connect.application.dto.response.VotoResponse;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PreguntaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.RespuestaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PreguntaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.RespuestaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForoServiceTest {

    @Mock private PreguntaJpaRepository preguntaRepository;
    @Mock private RespuestaJpaRepository respuestaRepository;
    @Mock private CarreraJpaRepository carreraRepository;
    @Mock private AsignaturaJpaRepository asignaturaRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private NotificacionService notificacionService;
    @Mock private FileStoragePort fileStoragePort;

    @InjectMocks private ForoService foroService;

    private UsuarioEntity autor;
    private UsuarioEntity otro;
    private CarreraEntity carrera;
    private AsignaturaEntity asignatura;

    @BeforeEach
    void setUp() {
        autor = TestData.usuario("Autor Pregunta");
        otro = TestData.usuario("Otro Estudiante");
        carrera = TestData.carrera("Ingeniería en Informática");
        asignatura = TestData.asignatura("Base de Datos", carrera);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** Imita los valores por defecto que asigna @PrePersist al guardar. */
    private static PreguntaEntity preguntaPersistida(PreguntaEntity pregunta) {
        pregunta.setId(UUID.randomUUID());
        pregunta.setVotos(0);
        return pregunta;
    }

    private static RespuestaEntity respuestaPersistida(RespuestaEntity respuesta) {
        respuesta.setId(UUID.randomUUID());
        respuesta.setVotos(0);
        respuesta.setAceptada(false);
        return respuesta;
    }

    private PreguntaEntity pregunta() {
        PreguntaEntity pregunta = new PreguntaEntity();
        pregunta.setId(UUID.randomUUID());
        pregunta.setTitulo("¿Cómo funciona JOIN?");
        pregunta.setContenido("Duda");
        pregunta.setUsuario(autor);
        pregunta.setCarrera(carrera);
        pregunta.setAsignatura(asignatura);
        pregunta.setTematicaGeneral(false);
        pregunta.setVotos(0);
        return pregunta;
    }

    private RespuestaEntity respuesta(PreguntaEntity pregunta, UsuarioEntity usuario) {
        RespuestaEntity respuesta = new RespuestaEntity();
        respuesta.setId(UUID.randomUUID());
        respuesta.setPregunta(pregunta);
        respuesta.setUsuario(usuario);
        respuesta.setContenido("Une tablas por clave");
        respuesta.setVotos(0);
        respuesta.setAceptada(false);
        return respuesta;
    }

    private CrearPreguntaRequest request(UUID asignaturaId, boolean general) {
        CrearPreguntaRequest request = new CrearPreguntaRequest();
        request.setTitulo("  ¿Cómo funciona JOIN?  ");
        request.setContenido("Duda sobre SQL");
        request.setCarreraId(carrera.getId());
        request.setAsignaturaId(asignaturaId);
        request.setTematicaGeneral(general);
        return request;
    }

    /** HU-11: publicar pregunta en el foro (CP-11-01). */
    @Nested
    class PublicarPregunta {

        @BeforeEach
        void sesion() {
            TestData.loginComo(autor);
            when(usuarioRepository.findById(autor.getId())).thenReturn(Optional.of(autor));
            when(carreraRepository.findById(carrera.getId())).thenReturn(Optional.of(carrera));
        }

        @Test
        @DisplayName("Publica una pregunta de asignatura con el título recortado")
        void publicaConAsignatura() {
            when(asignaturaRepository.findByIdWithCarrera(asignatura.getId())).thenReturn(Optional.of(asignatura));
            when(preguntaRepository.save(any(PreguntaEntity.class))).thenAnswer(inv -> preguntaPersistida(inv.getArgument(0)));

            PreguntaResponse response = foroService.crearPregunta(request(asignatura.getId(), false), null);

            assertThat(response.getTitulo()).isEqualTo("¿Cómo funciona JOIN?");
            assertThat(response.getAsignaturaNombre()).isEqualTo("Base de Datos");
            assertThat(response.isTematicaGeneral()).isFalse();
            assertThat(response.getImagenUrl()).isNull();
        }

        @Test
        @DisplayName("Publica una pregunta de temática general sin asignatura y con imagen opcional")
        void publicaGeneralConImagen() {
            MockMultipartFile imagen = new MockMultipartFile("imagen", "diagrama.png", "image/png", new byte[]{1});
            when(fileStoragePort.storeForoImage(imagen)).thenReturn("/uploads/foro/diagrama.png");
            when(preguntaRepository.save(any(PreguntaEntity.class))).thenAnswer(inv -> preguntaPersistida(inv.getArgument(0)));

            PreguntaResponse response = foroService.crearPregunta(request(null, true), imagen);

            assertThat(response.isTematicaGeneral()).isTrue();
            assertThat(response.getAsignaturaId()).isNull();
            assertThat(response.getImagenUrl()).isEqualTo("/uploads/foro/diagrama.png");
        }

        @Test
        @DisplayName("Rechaza una pregunta sin asignatura que no es de temática general")
        void rechazaSinAsignatura() {
            assertThatThrownBy(() -> foroService.crearPregunta(request(null, false), null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("asignatura");
            verify(preguntaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Rechaza una asignatura que no pertenece a la carrera elegida")
        void rechazaAsignaturaDeOtraCarrera() {
            AsignaturaEntity ajena = TestData.asignatura("Redes", TestData.carrera("Conectividad"));
            when(asignaturaRepository.findByIdWithCarrera(ajena.getId())).thenReturn(Optional.of(ajena));

            assertThatThrownBy(() -> foroService.crearPregunta(request(ajena.getId(), false), null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("no pertenece");
            verify(preguntaRepository, never()).save(any());
        }
    }

    /** HU-12: responder, votar y aceptar respuestas (CP-12-01). */
    @Nested
    class ResponderVotarAceptar {

        @Test
        @DisplayName("Responder notifica al autor de la pregunta")
        void responderNotificaAlAutor() {
            PreguntaEntity pregunta = pregunta();
            TestData.loginComo(otro);
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            when(usuarioRepository.findById(otro.getId())).thenReturn(Optional.of(otro));
            when(respuestaRepository.save(any(RespuestaEntity.class))).thenAnswer(inv -> respuestaPersistida(inv.getArgument(0)));

            RespuestaResponse response = foroService.responder(pregunta.getId(), "  Une tablas  ");

            assertThat(response.getContenido()).isEqualTo("Une tablas");
            verify(notificacionService).notificarRespuestaForo(autor, pregunta.getTitulo(), otro.getNombre(), pregunta.getId());
        }

        @Test
        @DisplayName("Responder la propia pregunta no genera notificación")
        void responderPropiaNoNotifica() {
            PreguntaEntity pregunta = pregunta();
            TestData.loginComo(autor);
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            when(usuarioRepository.findById(autor.getId())).thenReturn(Optional.of(autor));
            when(respuestaRepository.save(any(RespuestaEntity.class))).thenAnswer(inv -> respuestaPersistida(inv.getArgument(0)));

            foroService.responder(pregunta.getId(), "Me respondo");

            verify(notificacionService, never()).notificarRespuestaForo(any(), any(), any(), any());
        }

        @Test
        @DisplayName("El primer voto suma y el segundo lo quita")
        void votoEsInterruptor() {
            PreguntaEntity pregunta = pregunta();
            TestData.loginComo(otro);
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));

            when(preguntaRepository.insertarVoto(pregunta.getId(), otro.getId())).thenReturn(1);
            VotoResponse primero = foroService.votarPregunta(pregunta.getId());
            assertThat(primero.votado()).isTrue();
            verify(preguntaRepository).ajustarVotos(pregunta.getId(), 1);

            when(preguntaRepository.insertarVoto(pregunta.getId(), otro.getId())).thenReturn(0);
            VotoResponse segundo = foroService.votarPregunta(pregunta.getId());
            assertThat(segundo.votado()).isFalse();
            verify(preguntaRepository).eliminarVoto(pregunta.getId(), otro.getId());
            verify(preguntaRepository).ajustarVotos(pregunta.getId(), -1);
        }

        @Test
        @DisplayName("No se puede votar la propia pregunta ni la propia respuesta")
        void noVotarPropio() {
            PreguntaEntity pregunta = pregunta();
            RespuestaEntity respuesta = respuesta(pregunta, autor);
            TestData.loginComo(autor);
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            when(respuestaRepository.findByIdWithDetails(respuesta.getId())).thenReturn(Optional.of(respuesta));

            assertThatThrownBy(() -> foroService.votarPregunta(pregunta.getId()))
                    .isInstanceOf(BusinessException.class);
            assertThatThrownBy(() -> foroService.votarRespuesta(respuesta.getId()))
                    .isInstanceOf(BusinessException.class);
            verify(preguntaRepository, never()).insertarVoto(any(), any());
            verify(respuestaRepository, never()).insertarVoto(any(), any());
            verify(preguntaRepository, never()).ajustarVotos(any(), anyInt());
        }

        @Test
        @DisplayName("Solo el autor de la pregunta puede aceptar una respuesta")
        void soloAutorAcepta() {
            RespuestaEntity respuesta = respuesta(pregunta(), otro);
            TestData.loginComo(otro);
            when(respuestaRepository.findByIdWithDetails(respuesta.getId())).thenReturn(Optional.of(respuesta));

            assertThatThrownBy(() -> foroService.aceptarRespuesta(respuesta.getId()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Solo quien hizo la pregunta");
            verify(respuestaRepository, never()).quitarAceptadas(any());
        }

        @Test
        @DisplayName("Aceptar marca la solución (quitando la anterior) y aceptarla de nuevo la desmarca")
        void aceptarYDesmarcar() {
            PreguntaEntity pregunta = pregunta();
            RespuestaEntity respuesta = respuesta(pregunta, otro);
            TestData.loginComo(autor);
            when(respuestaRepository.findByIdWithDetails(respuesta.getId())).thenReturn(Optional.of(respuesta));

            RespuestaResponse aceptada = foroService.aceptarRespuesta(respuesta.getId());
            assertThat(aceptada.isAceptada()).isTrue();

            RespuestaResponse desmarcada = foroService.aceptarRespuesta(respuesta.getId());
            assertThat(desmarcada.isAceptada()).isFalse();

            verify(respuestaRepository, org.mockito.Mockito.times(2)).quitarAceptadas(eq(pregunta.getId()));
        }
    }
}
