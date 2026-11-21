package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.HabilidadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HabilidadJpaRepository extends JpaRepository<HabilidadEntity, UUID> {
}
