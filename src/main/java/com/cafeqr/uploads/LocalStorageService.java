package com.cafeqr.uploads;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/** Saves uploads to the local filesystem and exposes them under {@code /files/**}. */
@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");

    private final Path rootDir;
    private final String publicBaseUrl;

    public LocalStorageService(AppProperties appProperties) {
        this.rootDir = Paths.get(appProperties.storage().localDir()).toAbsolutePath().normalize();
        this.publicBaseUrl = appProperties.publicBaseUrl();
    }

    @Override
    public String store(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(ErrorCode.UPLOAD_ERROR, "File is empty");
        }
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException(ErrorCode.UPLOAD_ERROR,
                    "Unsupported file type; allowed: " + ALLOWED_CONTENT_TYPES);
        }

        String extension = resolveExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Path folderPath = rootDir.resolve(folder).normalize();
            if (!folderPath.startsWith(rootDir)) {
                throw new BadRequestException(ErrorCode.UPLOAD_ERROR, "Invalid storage folder");
            }
            Files.createDirectories(folderPath);
            Path target = folderPath.resolve(filename);
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to store upload", e);
            throw new BadRequestException(ErrorCode.UPLOAD_ERROR, "Could not store file");
        }

        return publicBaseUrl + "/files/" + folder + "/" + filename;
    }

    private String resolveExtension(String originalFilename) {
        String ext = StringUtils.getFilenameExtension(originalFilename);
        return (ext != null && !ext.isBlank()) ? "." + ext.toLowerCase() : "";
    }
}
