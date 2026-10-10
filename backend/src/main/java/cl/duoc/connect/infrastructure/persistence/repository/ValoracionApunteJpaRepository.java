package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.ValoracionApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.ValoracionApunteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ValoracionApunteJpaRepository extends JpaRepository<ValoracionApunteEntity, ValoracionApunteId> {

    Optional<ValoracionApunteEntity> findByApunteIdAndUsuarioId(UUID apunteId, UUID usuarioId);
}
