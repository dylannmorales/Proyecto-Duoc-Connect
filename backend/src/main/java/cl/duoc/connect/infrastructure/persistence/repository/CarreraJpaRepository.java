package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CarreraJpaRepository extends JpaRepository<CarreraEntity, UUID> {
}
