package cl.duoc.connect.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "habilidades")
@Getter
@Setter
public class HabilidadEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
