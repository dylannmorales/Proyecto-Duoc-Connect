package cl.duoc.connect.infrastructure.persistence.entity;

import cl.duoc.connect.domain.enums.EstadoInvitacion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Invitación a un grupo enviada desde el perfil de un compañero, que la persona invitada acepta o rechaza. */
@Entity
@Table(name = "invitaciones_directas")
@Getter
@Setter
public class InvitacionDirectaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grupo_id", nullable = false)
    private GrupoEstudioEntity grupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitador_id", nullable = false)
    private UsuarioEntity invitador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitado_id", nullable = false)
    private UsuarioEntity invitado;

    @Column(length = 300)
    private String mensaje;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoInvitacion estado;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "respondida_at")
    private Instant respondidaAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (estado == null) {
            estado = EstadoInvitacion.PENDIENTE;
        }
    }
}
