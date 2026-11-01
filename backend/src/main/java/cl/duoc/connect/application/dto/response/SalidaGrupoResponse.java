package cl.duoc.connect.application.dto.response;

/** Resultado de salir de un grupo: si se eliminó por quedar vacío y, si aplica, quién quedó como administrador. */
public record SalidaGrupoResponse(boolean grupoEliminado, String nuevoAdministrador) {
}
