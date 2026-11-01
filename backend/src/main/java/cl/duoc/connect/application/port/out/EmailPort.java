package cl.duoc.connect.application.port.out;

public interface EmailPort {

    void sendPasswordResetEmail(String to, String resetLink);

    void sendGroupInvitationEmail(String to, String grupoNombre, String invitadorNombre, String invitationLink, String codigo);
}
