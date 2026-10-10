package cl.duoc.connect.application.port.out;

public interface EmailPort {

    void sendPasswordResetEmail(String to, String resetLink);
}
