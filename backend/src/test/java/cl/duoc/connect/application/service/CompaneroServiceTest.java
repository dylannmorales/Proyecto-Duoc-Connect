package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdatePerfilProyectoRequest;
import cl.duoc.connect.application.dto.response.CompaneroRecomendacionResponse;
import cl.duoc.connect.application.dto.response.PerfilProyectoResponse;
import cl.duoc.connect.domain.enums.NivelHabilidad;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.domain.service.MatchingService;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.DisponibilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.HabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PerfilProyectoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioAsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioHabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.DisponibilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.HabilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PerfilProyectoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioAsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioHabilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompaneroServiceTest {

    @Mock private PerfilProyectoJpaRepository perfilRepository;
    @Mock private UsuarioAsignaturaJpaRepository usuarioAsignaturaRepository;
    @Mock private UsuarioHabilidadJpaRepository usuarioHabilidadRepository;
    @Mock private DisponibilidadJpaRepository disponibilidadRepository;
    @Mock private AsignaturaJpaRepository asignaturaRepository;
    @Mock private HabilidadJpaRepository habilidadRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Spy private MatchingService matchingService = new MatchingService();

    @InjectMocks private CompaneroService companeroService;

    private CarreraEntity informatica;
    private AsignaturaEntity bd;
    private HabilidadEntity java;
    private UsuarioEntity yo;

    @BeforeEach
    void setUp() {
        informatica = TestData.carrera("Ingeniería en Informática");
        bd = TestData.asignatura("Bases de Datos", informatica);
        java = new HabilidadEntity();
        java.setId(UUID.randomUUID());
        java.setNombre("Java");
        yo = TestData.usuario("Camila Rojas", informatica);
        TestData.loginComo(yo);
        when(usuarioRepository.findByIdWithRelations(yo.getId())).thenReturn(Optional.of(yo));
        when(asignaturaRepository.findById(bd.getId())).thenReturn(Optional.of(bd));
        when(habilidadRepository.findById(java.getId())).thenReturn(Optional.of(java));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("HU-13: perfil de compañero")
    class MiPerfil {

        @Test
        @DisplayName("Sin perfil guardado devuelve valores por defecto")
        void sinPerfil() {
            when(perfilRepository.findByUsuarioIdWithUsuario(yo.getId())).thenReturn(Optional.empty());

            PerfilProyectoResponse r = companeroService.obtenerMiPerfil();

            assertThat(r.isBuscandoCompanero()).isFalse();
            assertThat(r.getVisibilidad()).isEqualTo(VisibilidadPerfil.SOLO_CARRERA);
            assertThat(r.getCarreraNombre()).isEqualTo("Ingeniería en Informática");
        }

        @Test
        @DisplayName("Guarda bio, asignaturas, habilidades y horarios (sin duplicados)")
        void guardar() {
            when(perfilRepository.findById(yo.getId())).thenReturn(Optional.empty());
            UpdatePerfilProyectoRequest req = request();
            req.setAsignaturaIds(List.of(bd.getId(), bd.getId()));
            UpdatePerfilProyectoRequest.HabilidadPerfilRequest h = habilidad(NivelHabilidad.AVANZADO);
            req.setHabilidades(List.of(h, habilidad(NivelHabilidad.BASICO)));
            req.setDisponibilidades(List.of(horario(10, 12)));

            PerfilProyectoResponse r = companeroService.actualizarMiPerfil(req);

            ArgumentCaptor<PerfilProyectoEntity> perfil = ArgumentCaptor.forClass(PerfilProyectoEntity.class);
            verify(perfilRepository).save(perfil.capture());
            assertThat(perfil.getValue().getBio()).isEqualTo("Busco equipo para el capstone");
            assertThat(perfil.getValue().getVisibilidad()).isEqualTo(VisibilidadPerfil.SOLO_CARRERA);
            verify(usuarioAsignaturaRepository, times(1)).save(any(UsuarioAsignaturaEntity.class));
            verify(usuarioHabilidadRepository, times(1)).save(any(UsuarioHabilidadEntity.class));
            verify(disponibilidadRepository, times(1)).save(any(DisponibilidadEntity.class));
            assertThat(r.isBuscandoCompanero()).isTrue();
        }

        @Test
        @DisplayName("Listas vacías borran lo anterior y no guardan nada nuevo")
        void listasVacias() {
            PerfilProyectoEntity existente = new PerfilProyectoEntity();
            existente.setUsuario(yo);
            when(perfilRepository.findById(yo.getId())).thenReturn(Optional.of(existente));
            UpdatePerfilProyectoRequest req = request();
            req.setBio("   ");
            req.setVisibilidad(VisibilidadPerfil.PUBLICO);

            companeroService.actualizarMiPerfil(req);

            assertThat(existente.getBio()).isNull();
            assertThat(existente.getVisibilidad()).isEqualTo(VisibilidadPerfil.PUBLICO);
            verify(usuarioAsignaturaRepository).deleteByUsuario_Id(yo.getId());
            verify(usuarioAsignaturaRepository, never()).save(any());
            verify(disponibilidadRepository, never()).save(any());
        }

        @Test
        @DisplayName("Rechaza un horario cuya hora de fin no es posterior a la de inicio")
        void horarioInvalido() {
            when(perfilRepository.findById(yo.getId())).thenReturn(Optional.empty());
            UpdatePerfilProyectoRequest req = request();
            req.setDisponibilidades(List.of(horario(12, 10)));

            assertThatThrownBy(() -> companeroService.actualizarMiPerfil(req))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("HORARIO_INVALIDO");
        }

        @Test
        @DisplayName("Rechaza asignaturas o habilidades que no existen")
        void catalogoInexistente() {
            when(perfilRepository.findById(yo.getId())).thenReturn(Optional.empty());
            UpdatePerfilProyectoRequest req = request();
            req.setAsignaturaIds(List.of(UUID.randomUUID()));
            assertThatThrownBy(() -> companeroService.actualizarMiPerfil(req))
                    .extracting("code").isEqualTo("ASIGNATURA_NOT_FOUND");

            UpdatePerfilProyectoRequest req2 = request();
            UpdatePerfilProyectoRequest.HabilidadPerfilRequest h = new UpdatePerfilProyectoRequest.HabilidadPerfilRequest();
            h.setHabilidadId(UUID.randomUUID());
            h.setNivel(NivelHabilidad.BASICO);
            req2.setHabilidades(List.of(h));
            assertThatThrownBy(() -> companeroService.actualizarMiPerfil(req2))
                    .extracting("code").isEqualTo("HABILIDAD_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("HU-14: recomendaciones")
    class Recomendaciones {

        @Test
        @DisplayName("Ordena por compatibilidad y oculta perfiles de otra carrera que no son públicos")
        void ordenYVisibilidad() {
            UsuarioEntity afin = TestData.usuario("Valentina Soto", informatica);
            UsuarioEntity lejano = TestData.usuario("Matías González", informatica);
            CarreraEntity otraCarrera = TestData.carrera("Diseño Gráfico");
            UsuarioEntity publico = TestData.usuario("Sofía Fernández", otraCarrera);
            UsuarioEntity privado = TestData.usuario("Benjamín Muñoz", otraCarrera);

            asignaturas(yo, bd);
            asignaturas(afin, bd);
            when(perfilRepository.findCandidatos(yo.getId())).thenReturn(List.of(
                    perfil(lejano, VisibilidadPerfil.SOLO_CARRERA),
                    perfil(afin, VisibilidadPerfil.SOLO_CARRERA),
                    perfil(publico, VisibilidadPerfil.PUBLICO),
                    perfil(privado, VisibilidadPerfil.SOLO_CARRERA)));
            UsuarioHabilidadEntity uh = new UsuarioHabilidadEntity();
            uh.setHabilidad(java);
            uh.setNivel(NivelHabilidad.AVANZADO);
            when(usuarioHabilidadRepository.findByUsuarioIdWithHabilidad(afin.getId())).thenReturn(List.of(uh));

            List<CompaneroRecomendacionResponse> r = companeroService.obtenerRecomendaciones(10);

            assertThat(r).extracting(CompaneroRecomendacionResponse::getNombre)
                    .containsExactly("Valentina Soto", "Matías González", "Sofía Fernández");
            assertThat(r.get(0).getAsignaturasEnComun()).isEqualTo(1);
            assertThat(r.get(0).getHabilidadesDestacadas()).singleElement()
                    .satisfies(h -> assertThat(h.getNombre()).isEqualTo("Java"));
            assertThat(r.get(0).getMatchScore()).isGreaterThan(r.get(1).getMatchScore());
        }

        @Test
        @DisplayName("Filtra por asignatura y habilidad, y respeta el límite")
        void filtros() {
            UsuarioEntity a = TestData.usuario("Valentina Soto", informatica);
            UsuarioEntity b = TestData.usuario("Matías González", informatica);
            when(perfilRepository.findCandidatos(yo.getId())).thenReturn(List.of(
                    perfil(a, VisibilidadPerfil.SOLO_CARRERA), perfil(b, VisibilidadPerfil.SOLO_CARRERA)));
            when(usuarioAsignaturaRepository.existsByUsuario_IdAndAsignatura_Id(a.getId(), bd.getId())).thenReturn(true);
            when(usuarioHabilidadRepository.existsByUsuario_IdAndHabilidad_Id(a.getId(), java.getId())).thenReturn(true);

            assertThat(companeroService.buscarCompaneros(bd.getId(), null, 10)).extracting(CompaneroRecomendacionResponse::getNombre)
                    .containsExactly("Valentina Soto");
            assertThat(companeroService.buscarCompaneros(bd.getId(), java.getId(), 10)).hasSize(1);
            assertThat(companeroService.buscarCompaneros(null, UUID.randomUUID(), 10)).isEmpty();
            assertThat(companeroService.buscarCompaneros(null, null, 1)).hasSize(1);
        }
    }

    @Nested
    @DisplayName("HU-14: ver el perfil de un compañero")
    class PerfilDeCompanero {

        @Test
        @DisplayName("Muestra el perfil completo con la compatibilidad")
        void visible() {
            UsuarioEntity otro = TestData.usuario("Valentina Soto", informatica);
            asignaturas(yo, bd);
            asignaturas(otro, bd);
            PerfilProyectoEntity p = perfil(otro, VisibilidadPerfil.SOLO_CARRERA);
            p.setBio("Me gusta el backend");
            when(perfilRepository.findByUsuarioIdWithUsuario(otro.getId())).thenReturn(Optional.of(p));

            PerfilProyectoResponse r = companeroService.obtenerPerfilDeCompanero(otro.getId());

            assertThat(r.getNombre()).isEqualTo("Valentina Soto");
            assertThat(r.getBio()).isEqualTo("Me gusta el backend");
            assertThat(r.getAsignaturas()).extracting(PerfilProyectoResponse.AsignaturaItem::getNombre)
                    .containsExactly("Bases de Datos");
            assertThat(r.getAsignaturasEnComun()).isEqualTo(1);
            assertThat(r.getMatchScore()).isNotNull().isBetween(0, 100);
        }

        @Test
        @DisplayName("Oculta perfiles de otra carrera no públicos, que no buscan compañero o inexistentes")
        void oculto() {
            CarreraEntity otraCarrera = TestData.carrera("Diseño Gráfico");
            UsuarioEntity privado = TestData.usuario("Benjamín Muñoz", otraCarrera);
            when(perfilRepository.findByUsuarioIdWithUsuario(privado.getId()))
                    .thenReturn(Optional.of(perfil(privado, VisibilidadPerfil.SOLO_CARRERA)));

            UsuarioEntity inactivoBusqueda = TestData.usuario("Matías González", informatica);
            PerfilProyectoEntity noBusca = perfil(inactivoBusqueda, VisibilidadPerfil.PUBLICO);
            noBusca.setBuscandoCompanero(false);
            when(perfilRepository.findByUsuarioIdWithUsuario(inactivoBusqueda.getId())).thenReturn(Optional.of(noBusca));

            UUID inexistente = UUID.randomUUID();
            when(perfilRepository.findByUsuarioIdWithUsuario(inexistente)).thenReturn(Optional.empty());

            for (UUID id : List.of(privado.getId(), inactivoBusqueda.getId(), inexistente)) {
                assertThatThrownBy(() -> companeroService.obtenerPerfilDeCompanero(id))
                        .isInstanceOf(EntityNotFoundException.class);
            }
        }

        @Test
        @DisplayName("Un perfil de otra carrera marcado como público sí se puede ver")
        void publicoOtraCarrera() {
            UsuarioEntity publico = TestData.usuario("Sofía Fernández", TestData.carrera("Diseño Gráfico"));
            when(perfilRepository.findByUsuarioIdWithUsuario(publico.getId()))
                    .thenReturn(Optional.of(perfil(publico, VisibilidadPerfil.PUBLICO)));

            assertThat(companeroService.obtenerPerfilDeCompanero(publico.getId()).getNombre())
                    .isEqualTo("Sofía Fernández");
        }
    }

    private void asignaturas(UsuarioEntity usuario, AsignaturaEntity asignatura) {
        UsuarioAsignaturaEntity ua = new UsuarioAsignaturaEntity();
        ua.setUsuario(usuario);
        ua.setAsignatura(asignatura);
        when(usuarioAsignaturaRepository.findByUsuarioIdWithAsignatura(usuario.getId())).thenReturn(List.of(ua));
    }

    private PerfilProyectoEntity perfil(UsuarioEntity usuario, VisibilidadPerfil visibilidad) {
        PerfilProyectoEntity p = new PerfilProyectoEntity();
        p.setUsuario(usuario);
        p.setUsuarioId(usuario.getId());
        p.setBuscandoCompanero(true);
        p.setVisibilidad(visibilidad);
        return p;
    }

    private UpdatePerfilProyectoRequest request() {
        UpdatePerfilProyectoRequest req = new UpdatePerfilProyectoRequest();
        req.setBio("  Busco equipo para el capstone ");
        req.setBuscandoCompanero(true);
        return req;
    }

    private UpdatePerfilProyectoRequest.HabilidadPerfilRequest habilidad(NivelHabilidad nivel) {
        UpdatePerfilProyectoRequest.HabilidadPerfilRequest h = new UpdatePerfilProyectoRequest.HabilidadPerfilRequest();
        h.setHabilidadId(java.getId());
        h.setNivel(nivel);
        return h;
    }

    private UpdatePerfilProyectoRequest.DisponibilidadRequest horario(int desde, int hasta) {
        UpdatePerfilProyectoRequest.DisponibilidadRequest d = new UpdatePerfilProyectoRequest.DisponibilidadRequest();
        d.setDiaSemana((short) 1);
        d.setHoraInicio(LocalTime.of(desde, 0));
        d.setHoraFin(LocalTime.of(hasta, 0));
        return d;
    }
}
