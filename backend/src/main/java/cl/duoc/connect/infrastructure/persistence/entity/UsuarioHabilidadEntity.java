package cl.duoc.connect.infrastructure.persistence.entity;

import cl.duoc.connect.domain.enums.NivelHabilidad;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "usuario_habilidades")
@Getter
@Setter
public class UsuarioHabilidadEntity {

    @EmbeddedId
    private UsuarioHabilidadId id;

    @MapsId("usuarioId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioEntity usuario;

    @MapsId("habilidadId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habilidad_id", nullable = false)
    private HabilidadEntity habilidad;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "nivel_habilidad")
    private NivelHabilidad nivel;
}
