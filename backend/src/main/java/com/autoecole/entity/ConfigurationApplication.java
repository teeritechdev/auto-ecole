package com.autoecole.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "configuration_application")
@Getter
@Setter
@NoArgsConstructor
public class ConfigurationApplication {

    @Id
    private Long id = 1L;

    @Lob
    @Column(name = "logo_data", columnDefinition = "TEXT")
    private String logoData;
}
