package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.UsuarioAsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioAsignaturaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UsuarioAsignaturaJpaRepository extends JpaRepository<UsuarioAsignaturaEntity, UsuarioAsignaturaId> {

    void deleteByUsuario_Id(UUID usuarioId);

    @Query("""
            SELECT ua FROM UsuarioAsignaturaEntity ua
            JOIN FETCH ua.asignatura
            WHERE ua.usuario.id = :usuarioId
            """)
    List<UsuarioAsignaturaEntity> findByUsuarioIdWithAsignatura(@Param("usuarioId") UUID usuarioId);

    boolean existsByUsuario_IdAndAsignatura_Id(UUID usuarioId, UUID asignaturaId);
}
