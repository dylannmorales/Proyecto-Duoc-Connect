package cl.duoc.connect.application.port.out;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStoragePort {

    String storeProfilePhoto(MultipartFile file, String previousUrl);

    String storeApuntePdf(MultipartFile file);

    Resource loadAsResource(String fileUrl);

    void deleteStoredFile(String fileUrl);
}
