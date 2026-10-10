package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.NotificacionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface NotificacionJpaRepository extends JpaRepository<NotificacionEntity, UUID> {

    Page<NotificacionEntity> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId, Pageable pageable);

    long countByUsuarioIdAndLeidaFalse(UUID usuarioId);

    @Modifying
    @Query("UPDATE NotificacionEntity n SET n.leida = true WHERE n.usuario.id = :usuarioId AND n.leida = false")
    int marcarTodasLeidas(@Param("usuarioId") UUID usuarioId);
}
