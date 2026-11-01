package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.response.ApunteDescarga;
import cl.duoc.connect.application.dto.response.ApunteResponse;
import cl.duoc.connect.application.mapper.ApunteMapper;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.ValoracionApunteEntity;
import cl.duoc.connect.infrastructure.persistence.repository.ApunteJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.ValoracionApunteJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** HU-10: descargar y valorar apuntes (CP-10-01). */
@ExtendWith(MockitoExtension.class)
class ApunteServiceTest {

    @Mock private ApunteJpaRepository apunteRepository;
    @Mock private CarreraJpaRepository carreraRepository;
    @Mock private AsignaturaJpaRepository asignaturaRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private ValoracionApunteJpaRepository valoracionRepository;
    @Mock private FileStoragePort fileStoragePort;
    @Spy private ApunteMapper apunteMapper = new ApunteMapper();

    @InjectMocks private ApunteService apunteService;

    private UsuarioEntity autor;
    private UsuarioEntity lector;
    private ApunteEntity apunte;

    @BeforeEach
    void setUp() {
        autor = TestData.usuario("Autora Apunte");
        lector = TestData.usuario("Lector Apunte");
        CarreraEntity carrera = TestData.carrera("Ingeniería en Informática");

        apunte = new ApunteEntity();
        apunte.setId(UUID.randomUUID());
        apunte.setTitulo("Resumen SQL");
        apunte.setUsuario(autor);
        apunte.setCarrera(carrera);
        apunte.setAsignatura(TestData.asignatura("Base de Datos", carrera));
        apunte.setArchivoUrl("/uploads/apuntes/resumen.pdf");
        apunte.setNombreArchivo("resumen.pdf");
        apunte.setTamanoBytes(1024L);
        apunte.setPromedioValoracion(BigDecimal.ZERO);
        apunte.setTotalValoraciones(0);
        apunte.setDescargas(0);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Descargar entrega el PDF con su nombre e incrementa el contador")
    void descargarIncrementaContador() {
        Resource pdf = new ByteArrayResource(new byte[]{1, 2, 3});
        when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
        when(fileStoragePort.loadAsResource(apunte.getArchivoUrl())).thenReturn(pdf);

        ApunteDescarga descarga = apunteService.descargarApunte(apunte.getId());

        assertThat(descarga.resource()).isSameAs(pdf);
        assertThat(descarga.nombreArchivo()).isEqualTo("resumen.pdf");
        verify(apunteRepository).incrementarDescargas(apunte.getId());
    }

    @Test
    @DisplayName("Descargar un apunte inexistente responde 'no encontrado' y no cuenta descarga")
    void descargarInexistente() {
        UUID id = UUID.randomUUID();
        when(apunteRepository.findByIdWithDetails(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> apunteService.descargarApunte(id)).isInstanceOf(EntityNotFoundException.class);
        verify(apunteRepository, never()).incrementarDescargas(any());
    }

    @Test
    @DisplayName("Valorar registra la puntuación y actualiza promedio y total")
    void valorarActualizaPromedio() {
        TestData.loginComo(lector);
        when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
        when(usuarioRepository.findById(lector.getId())).thenReturn(Optional.of(lector));
        when(valoracionRepository.findByApunteIdAndUsuarioId(apunte.getId(), lector.getId()))
                .thenReturn(Optional.empty());
        when(valoracionRepository.promedioPorApunte(apunte.getId())).thenReturn(4.333);
        when(valoracionRepository.countByApunteId(apunte.getId())).thenReturn(3L);

        ApunteResponse response = apunteService.valorarApunte(apunte.getId(), (short) 4);

        ArgumentCaptor<ValoracionApunteEntity> captor = ArgumentCaptor.forClass(ValoracionApunteEntity.class);
        verify(valoracionRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getPuntuacion()).isEqualTo((short) 4);
        assertThat(captor.getValue().getUsuario()).isSameAs(lector);

        assertThat(response.getPromedioValoracion()).isEqualByComparingTo("4.33");
        assertThat(response.getTotalValoraciones()).isEqualTo(3);
        assertThat(response.getMiValoracion()).isEqualTo((short) 4);
    }

    @Test
    @DisplayName("Volver a valorar cambia la puntuación existente en vez de duplicarla")
    void revalorarActualizaExistente() {
        TestData.loginComo(lector);
        ValoracionApunteEntity existente = new ValoracionApunteEntity();
        existente.setPuntuacion((short) 2);
        when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
        when(usuarioRepository.findById(lector.getId())).thenReturn(Optional.of(lector));
        when(valoracionRepository.findByApunteIdAndUsuarioId(apunte.getId(), lector.getId()))
                .thenReturn(Optional.of(existente));
        when(valoracionRepository.promedioPorApunte(apunte.getId())).thenReturn(5.0);
        when(valoracionRepository.countByApunteId(apunte.getId())).thenReturn(1L);

        apunteService.valorarApunte(apunte.getId(), (short) 5);

        verify(valoracionRepository).saveAndFlush(existente);
        assertThat(existente.getPuntuacion()).isEqualTo((short) 5);
        assertThat(apunte.getTotalValoraciones()).isEqualTo(1);
    }

    @Test
    @DisplayName("No se puede valorar un apunte propio")
    void noValorarPropio() {
        TestData.loginComo(autor);
        when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
        when(usuarioRepository.findById(autor.getId())).thenReturn(Optional.of(autor));

        assertThatThrownBy(() -> apunteService.valorarApunte(apunte.getId(), (short) 5))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("propio apunte");
        verify(valoracionRepository, never()).saveAndFlush(any());
    }
}
