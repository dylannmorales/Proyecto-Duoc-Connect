package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdateProfileRequest;
import cl.duoc.connect.application.dto.response.UsuarioResponse;
import cl.duoc.connect.application.mapper.UsuarioMapper;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.SedeEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.SedeJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioJpaRepository usuarioRepository;
    private final CarreraJpaRepository carreraRepository;
    private final SedeJpaRepository sedeRepository;
    private final UsuarioMapper usuarioMapper;
    private final FileStoragePort fileStoragePort;

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPerfilActual() {
        return usuarioMapper.toResponse(getCurrentUsuario());
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPerfilPublico(UUID id) {
        UsuarioEntity usuario = usuarioRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(UpdateProfileRequest request) {
        UsuarioEntity usuario = getCurrentUsuario();

        CarreraEntity carrera = carreraRepository.findById(request.getCarreraId())
                .orElseThrow(() -> new BusinessException("CARRERA_NOT_FOUND", "Carrera no encontrada"));
        SedeEntity sede = sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new BusinessException("SEDE_NOT_FOUND", "Sede no encontrada"));

        usuario.setNombre(request.getNombre().trim());
        usuario.setCarrera(carrera);
        usuario.setSede(sede);
        usuario.setSemestre(request.getSemestre());

        return usuarioMapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizarFoto(MultipartFile file) {
        UsuarioEntity usuario = getCurrentUsuario();
        String fotoUrl = fileStoragePort.storeProfilePhoto(file, usuario.getFotoUrl());
        usuario.setFotoUrl(fotoUrl);
        return usuarioMapper.toResponse(usuarioRepository.save(usuario));
    }

    private UsuarioEntity getCurrentUsuario() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        return usuarioRepository.findByIdWithRelations(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
