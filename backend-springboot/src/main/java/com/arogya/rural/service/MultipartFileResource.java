package com.arogya.rural.service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

class MultipartFileResource extends ByteArrayResource {

    private final String filename;

    private MultipartFileResource(byte[] byteArray, String filename) {
        super(byteArray);
        this.filename = filename == null || filename.isBlank() ? "upload" : filename;
    }

    static MultipartFileResource from(MultipartFile file) throws IOException {
        return new MultipartFileResource(file.getBytes(), file.getOriginalFilename());
    }

    static HttpEntity<MultipartFileResource> partFrom(MultipartFile file) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            headers.setContentType(MediaType.parseMediaType(contentType));
        }
        return new HttpEntity<>(from(file), headers);
    }

    @Override
    public String getFilename() {
        return filename;
    }
}
