package cl.duoc.connect.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UsuarioAsignaturaId implements Serializable {

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "asignatura_id")
    private UUID asignaturaId;
}
