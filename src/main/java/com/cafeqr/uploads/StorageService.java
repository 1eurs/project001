package com.cafeqr.uploads;

import org.springframework.web.multipart.MultipartFile;

/** Abstraction over file storage. Local implementation now; S3 later. */
public interface StorageService {

    /**
     * Stores an uploaded file under the given logical folder and returns a publicly accessible URL.
     */
    String store(MultipartFile file, String folder);
}
