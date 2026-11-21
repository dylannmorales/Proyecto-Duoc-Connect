package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdateProfileRequest;
import cl.duoc.connect.application.dto.response.NotificacionResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.dto.response.UsuarioResponse;
import cl.duoc.connect.application.mapper.CatalogoMapper;
import cl.duoc.connect.application.mapper.UsuarioMapper;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.enums.TipoNotificacion;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.HabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.NotificacionEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.HabilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.NotificacionJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.SedeJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** HU-04 (perfil), HU-08 (notificaciones) y catálogos. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UsuarioNotificacionCatalogoServiceTest {

    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private CarreraJpaRepository carreraRepository;
    @Mock private SedeJpaRepository sedeRepository;
    @Mock private AsignaturaJpaRepository asignaturaRepository;
    @Mock private HabilidadJpaRepository habilidadRepository;
    @Mock private NotificacionJpaRepository notificacionRepository;
    @Mock private FileStoragePort fileStoragePort;

    private UsuarioService usuarioService;
    private NotificacionService notificacionService;
    private CatalogoService catalogoService;
    private CarreraEntity carrera;
    private UsuarioEntity yo;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(usuarioRepository, carreraRepository, sedeRepository, new UsuarioMapper(), fileStoragePort);
        notificacionService = new NotificacionService(notificacionRepository, usuarioRepository);
        catalogoService = new CatalogoService(carreraRepository, sedeRepository, asignaturaRepository, habilidadRepository, new CatalogoMapper());
        carrera = TestData.carrera("Ingeniería en Informática");
        yo = TestData.usuario("Camila Rojas", carrera);
        TestData.loginComo(yo);
        when(usuarioRepository.findByIdWithRelations(yo.getId())).thenReturn(Optional.of(yo));
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("HU-04: perfil de usuario")
    class Perfil {

        @Test
        @DisplayName("Devuelve el perfil propio y el público de un usuario activo")
        void obtener() {
            assertThat(usuarioService.obtenerPerfilActual().getEmail()).isEqualTo("camila.rojas@duocuc.cl");
            assertThat(usuarioService.obtenerPerfilPublico(yo.getId()).getCarreraNombre()).isEqualTo("Ingeniería en Informática");
        }

        @Test
        @DisplayName("Un usuario desactivado o inexistente no tiene perfil público")
        void perfilPublicoOculto() {
            UsuarioEntity inactivo = TestData.usuario("Inactivo", carrera);
            inactivo.setActivo(false);
            when(usuarioRepository.findByIdWithRelations(inactivo.getId())).thenReturn(Optional.of(inactivo));

            assertThatThrownBy(() -> usuarioService.obtenerPerfilPublico(inactivo.getId())).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> usuarioService.obtenerPerfilPublico(UUID.randomUUID())).isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Actualiza nombre, carrera, sede y semestre")
        void actualizar() {
            CarreraEntity otra = TestData.carrera("Diseño Gráfico");
            when(carreraRepository.findById(otra.getId())).thenReturn(Optional.of(otra));
            when(sedeRepository.findById(yo.getSede().getId())).thenReturn(Optional.of(yo.getSede()));
            UpdateProfileRequest req = new UpdateProfileRequest();
            req.setNombre("  Camila R. ");
            req.setCarreraId(otra.getId());
            req.setSedeId(yo.getSede().getId());
            req.setSemestre((short) 6);

            UsuarioResponse r = usuarioService.actualizarPerfil(req);

            assertThat(r.getNombre()).isEqualTo("Camila R.");
            assertThat(r.getCarreraNombre()).isEqualTo("Diseño Gráfico");
            assertThat(r.getSemestre()).isEqualTo((short) 6);
        }

        @Test
        @DisplayName("Rechaza carrera o sede inexistentes al actualizar")
        void actualizarCatalogoInexistente() {
            UpdateProfileRequest req = new UpdateProfileRequest();
            req.setNombre("Camila");
            req.setCarreraId(UUID.randomUUID());
            req.setSedeId(UUID.randomUUID());
            assertThatThrownBy(() -> usuarioService.actualizarPerfil(req))
                    .isInstanceOf(BusinessException.class).extracting("code").isEqualTo("CARRERA_NOT_FOUND");

            when(carreraRepository.findById(carrera.getId())).thenReturn(Optional.of(carrera));
            req.setCarreraId(carrera.getId());
            assertThatThrownBy(() -> usuarioService.actualizarPerfil(req)).extracting("code").isEqualTo("SEDE_NOT_FOUND");
        }

        @Test
        @DisplayName("Reemplaza la foto de perfil")
        void foto() {
            yo.setFotoUrl("/uploads/fotos/vieja.png");
            MockMultipartFile file = new MockMultipartFile("file", "f.png", "image/png", new byte[]{1, 2});
            when(fileStoragePort.storeProfilePhoto(file, "/uploads/fotos/vieja.png")).thenReturn("/uploads/fotos/nueva.png");

            assertThat(usuarioService.actualizarFoto(file).getFotoUrl()).isEqualTo("/uploads/fotos/nueva.png");
        }
    }

    @Nested
    @DisplayName("HU-08: notificaciones")
    class Notificaciones {

        @Test
        @DisplayName("Lista las notificaciones del usuario y cuenta las no leídas")
        void listar() {
            NotificacionEntity n = notificacion(yo);
            when(notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc(any(), any())).thenReturn(new PageImpl<>(List.of(n)));
            when(notificacionRepository.countByUsuarioIdAndLeidaFalse(yo.getId())).thenReturn(3L);

            PageResponse<NotificacionResponse> page = notificacionService.listar(0, 10);

            assertThat(page.getContent()).singleElement().satisfies(r -> {
                assertThat(r.getTipo()).isEqualTo("MENSAJE_GRUPO");
                assertThat(r.isLeida()).isFalse();
            });
            assertThat(notificacionService.contarNoLeidas()).isEqualTo(3);
        }

        @Test
        @DisplayName("Marca como leída solo una notificación propia")
        void marcarLeida() {
            NotificacionEntity propia = notificacion(yo);
            NotificacionEntity ajena = notificacion(TestData.usuario("Otro", carrera));
            when(notificacionRepository.findById(propia.getId())).thenReturn(Optional.of(propia));
            when(notificacionRepository.findById(ajena.getId())).thenReturn(Optional.of(ajena));

            notificacionService.marcarLeida(propia.getId());
            assertThat(propia.getLeida()).isTrue();

            assertThatThrownBy(() -> notificacionService.marcarLeida(ajena.getId())).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> notificacionService.marcarLeida(UUID.randomUUID())).isInstanceOf(EntityNotFoundException.class);

            notificacionService.marcarTodasLeidas();
            verify(notificacionRepository).marcarTodasLeidas(yo.getId());
        }

        @Test
        @DisplayName("Crea cada tipo de aviso con su enlace")
        void crearAvisos() {
            UUID id = UUID.randomUUID();
            when(usuarioRepository.findById(yo.getId())).thenReturn(Optional.of(yo));
            ArgumentCaptor<NotificacionEntity> captor = ArgumentCaptor.forClass(NotificacionEntity.class);

            notificacionService.notificarMensajeGrupo(yo.getId(), "Grupo BD", "Vale", id);
            notificacionService.notificarRespuestaForo(yo, "¿3FN?", "Vale", id);
            notificacionService.notificarInvitacionGrupo(yo, "Grupo BD", "Vale", "ABC123");
            notificacionService.notificarApunteCompartido(yo, "Resumen", "Vale", id);

            verify(notificacionRepository, org.mockito.Mockito.times(4)).save(captor.capture());
            assertThat(captor.getAllValues()).extracting(NotificacionEntity::getTipo).containsExactly(
                    TipoNotificacion.MENSAJE_GRUPO, TipoNotificacion.RESPUESTA_FORO,
                    TipoNotificacion.INVITACION_GRUPO, TipoNotificacion.APUNTE_COMPARTIDO);
            assertThat(captor.getAllValues()).extracting(NotificacionEntity::getEnlace).containsExactly(
                    "/grupos/" + id, "/foro/" + id, "/grupos/unirse/ABC123", "/apuntes/" + id);
        }

        @Test
        @DisplayName("No crea un aviso de mensaje si el destinatario ya no existe")
        void destinatarioInexistente() {
            notificacionService.notificarMensajeGrupo(UUID.randomUUID(), "Grupo", "Vale", UUID.randomUUID());
            verify(notificacionRepository, never()).save(any());
        }

        private NotificacionEntity notificacion(UsuarioEntity usuario) {
            NotificacionEntity n = new NotificacionEntity();
            n.setId(UUID.randomUUID());
            n.setUsuario(usuario);
            n.setTipo(TipoNotificacion.MENSAJE_GRUPO);
            n.setTitulo("Nuevo mensaje");
            n.setLeida(false);
            return n;
        }
    }

    @Nested
    @DisplayName("Catálogos")
    class Catalogos {

        @Test
        @DisplayName("Lista carreras, sedes, habilidades y asignaturas de una carrera")
        void listar() {
            HabilidadEntity java = new HabilidadEntity();
            java.setId(UUID.randomUUID());
            java.setNombre("Java");
            when(carreraRepository.findAll()).thenReturn(List.of(carrera));
            when(sedeRepository.findAll()).thenReturn(List.of(yo.getSede()));
            when(habilidadRepository.findAll()).thenReturn(List.of(java));
            when(carreraRepository.existsById(carrera.getId())).thenReturn(true);
            when(asignaturaRepository.findByCarreraIdOrderByNombreAsc(carrera.getId()))
                    .thenReturn(List.of(TestData.asignatura("Bases de Datos", carrera)));

            assertThat(catalogoService.listarCarreras()).hasSize(1);
            assertThat(catalogoService.listarSedes()).hasSize(1);
            assertThat(catalogoService.listarHabilidades()).hasSize(1);
            assertThat(catalogoService.listarAsignaturasPorCarrera(carrera.getId())).hasSize(1);
        }

        @Test
        @DisplayName("Asignaturas de una carrera inexistente responde no encontrado")
        void carreraInexistente() {
            assertThatThrownBy(() -> catalogoService.listarAsignaturasPorCarrera(UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }
}
