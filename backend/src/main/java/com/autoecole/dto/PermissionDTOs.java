package com.autoecole.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PermissionDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PermissionDTO {
        private Long id;
        private String code;
        private String module;
        private String libelle;
    }
}
