package cl.duoc.connect.application.dto.response;

/** Resultado de invitar un correo a un grupo. estado: ENVIADA, YA_ES_MIEMBRO o INVALIDO. */
public record InvitacionResponse(String email, String estado, String mensaje) {

    public static InvitacionResponse enviada(String email) {
        return new InvitacionResponse(email, "ENVIADA", "Invitación enviada");
    }

    public static InvitacionResponse yaEsMiembro(String email) {
        return new InvitacionResponse(email, "YA_ES_MIEMBRO", "Ya es miembro del grupo");
    }

    public static InvitacionResponse invalido(String email) {
        return new InvitacionResponse(email, "INVALIDO", "Debe ser un correo institucional @duocuc.cl");
    }
}
