package cl.duoc.connect.infrastructure.persistence.entity;

import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "perfiles_proyecto")
@Getter
@Setter
public class PerfilProyectoEntity {

    @Id
    private UUID usuarioId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private UsuarioEntity usuario;

    @Column(name = "buscando_companero", nullable = false)
    private Boolean buscandoCompanero;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "visibilidad_perfil")
    private VisibilidadPerfil visibilidad;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (buscandoCompanero == null) {
            buscandoCompanero = false;
        }
        if (visibilidad == null) {
            visibilidad = VisibilidadPerfil.SOLO_CARRERA;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
