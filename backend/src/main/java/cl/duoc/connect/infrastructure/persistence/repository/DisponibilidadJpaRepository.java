package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.DisponibilidadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisponibilidadJpaRepository extends JpaRepository<DisponibilidadEntity, UUID> {

    void deleteByUsuario_Id(UUID usuarioId);

    List<DisponibilidadEntity> findByUsuario_IdOrderByDiaSemanaAscHoraInicioAsc(UUID usuarioId);
}
