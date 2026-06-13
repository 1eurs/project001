package com.cafeqr.uploads;

import com.cafeqr.common.config.AppProperties;
import com.cafeqr.common.exception.BadRequestException;
import com.cafeqr.common.exception.ErrorCode;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/** Saves uploads to the local filesystem and exposes them under {@code /files/**}. */
@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");

    /** Menus render thumbnails; a raw phone photo is ~10x more pixels than any screen needs. */
    private static final int MAX_DIMENSION = 1280;

    private final Path rootDir;

    public LocalStorageService(AppProperties appProperties) {
        this.rootDir = Paths.get(appProperties.storage().localDir()).toAbsolutePath().normalize();
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
            Files.write(target, downscaleIfNeeded(file.getBytes(), file.getContentType()));
        } catch (IOException e) {
            log.error("Failed to store upload", e);
            throw new BadRequestException(ErrorCode.UPLOAD_ERROR, "Could not store file");
        }

        return "/files/" + folder + "/" + filename;
    }

    /**
     * Resizes oversized JPEG/PNG uploads to fit {@link #MAX_DIMENSION} so customer menus
     * don't download multi-MB photos. WebP/GIF (no ImageIO codec / animation) and anything
     * undecodable are stored untouched.
     */
    private byte[] downscaleIfNeeded(byte[] original, String contentType) {
        boolean jpeg = "image/jpeg".equals(contentType) || "image/jpg".equals(contentType);
        if (!jpeg && !"image/png".equals(contentType)) {
            return original;
        }
        try {
            if (!exceedsMaxDimension(original)) {
                return original;
            }
            var out = new ByteArrayOutputStream();
            var builder = Thumbnails.of(new ByteArrayInputStream(original))
                    .size(MAX_DIMENSION, MAX_DIMENSION)
                    .useExifOrientation(true);
            if (jpeg) {
                builder.outputQuality(0.82);
            }
            builder.toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.warn("Could not downscale upload; storing original", e);
            return original;
        }
    }

    /** Reads only the image header — no full decode — to check dimensions. */
    private boolean exceedsMaxDimension(byte[] bytes) throws IOException {
        try (var iis = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                return false;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(iis);
                return reader.getWidth(0) > MAX_DIMENSION || reader.getHeight(0) > MAX_DIMENSION;
            } finally {
                reader.dispose();
            }
        }
    }

    private String resolveExtension(String originalFilename) {
        String ext = StringUtils.getFilenameExtension(originalFilename);
        return (ext != null && !ext.isBlank()) ? "." + ext.toLowerCase() : "";
    }
}
