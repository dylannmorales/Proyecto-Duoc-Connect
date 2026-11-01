package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.ValoracionApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.ValoracionApunteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ValoracionApunteJpaRepository extends JpaRepository<ValoracionApunteEntity, ValoracionApunteId> {

    Optional<ValoracionApunteEntity> findByApunteIdAndUsuarioId(UUID apunteId, UUID usuarioId);

    @Query("SELECT v FROM ValoracionApunteEntity v WHERE v.usuario.id = :usuarioId AND v.apunte.id IN :apunteIds")
    List<ValoracionApunteEntity> findByUsuarioIdAndApunteIdIn(
            @Param("usuarioId") UUID usuarioId,
            @Param("apunteIds") Collection<UUID> apunteIds);

    @Query("SELECT AVG(v.puntuacion) FROM ValoracionApunteEntity v WHERE v.apunte.id = :apunteId")
    Double promedioPorApunte(@Param("apunteId") UUID apunteId);

    long countByApunteId(UUID apunteId);
}
