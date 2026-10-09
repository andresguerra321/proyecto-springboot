package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity;

import com.campus.rentaequipos.identity.domain.model.Role;
import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class RoleJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private Role name;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    public RoleJpaEntity() {}

    public RoleJpaEntity(Role name) {
        this.name = name;
        this.description = name.name();
    }

    public Integer getId() { return id; }
    public Role getName() { return name; }
    public String getDescription() { return description; }
}
