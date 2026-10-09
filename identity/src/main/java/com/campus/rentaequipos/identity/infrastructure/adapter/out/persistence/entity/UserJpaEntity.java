package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity;

import com.campus.rentaequipos.identity.domain.model.User;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
public class UserJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.MERGE})
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<RoleJpaEntity> roles = new HashSet<>();

    public UserJpaEntity() {}

    public UserJpaEntity(UUID id, String username, String email, String passwordHash, boolean enabled, Set<RoleJpaEntity> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.roles = roles;
    }

    public static UserJpaEntity fromDomain(User user, Set<RoleJpaEntity> roleEntities) {
        return new UserJpaEntity(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isEnabled(),
                roleEntities
        );
    }

    public User toDomain() {
        return new User(
                this.id,
                this.username,
                this.email,
                this.passwordHash,
                this.enabled,
                this.roles.stream().map(RoleJpaEntity::getName).collect(Collectors.toSet())
        );
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEnabled() { return enabled; }
    public Set<RoleJpaEntity> getRoles() { return roles; }
}
