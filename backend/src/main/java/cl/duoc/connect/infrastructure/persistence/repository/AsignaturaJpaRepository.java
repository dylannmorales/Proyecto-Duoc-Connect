package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AsignaturaJpaRepository extends JpaRepository<AsignaturaEntity, UUID> {

    List<AsignaturaEntity> findByCarreraIdOrderByNombreAsc(UUID carreraId);

    @Query("SELECT a FROM AsignaturaEntity a JOIN FETCH a.carrera WHERE a.id = :id")
    Optional<AsignaturaEntity> findByIdWithCarrera(@Param("id") UUID id);
}
