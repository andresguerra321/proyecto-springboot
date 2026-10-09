# Graph Report - proyecto springboot  (2026-10-09)

## Corpus Check
- Corpus is ~17,930 words - fits in a single context window. You may not need a graph.

## Summary
- 155 nodes · 204 edges · 29 communities (17 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Flyway Schema & Relational Tables
- Security & OpenAPI Infrastructure
- Relational Schema 4NF Definition
- Domain Value Object Money
- Domain Value Object DateRange
- Health Endpoints & Deployment Verification
- Maven Wrapper Automation
- Domain Exception Hierarchy
- Bootstrap Application & Container Lifecycle
- Security Role & RBAC Authorities
- Context Integration Tests
- Hexagonal Architecture Specification
- Billing Domain Module
- Catalog Domain Module
- Identity Domain Module
- Rental Domain Module
- Reporting Domain Module
- Docker Multi-Service Orchestration
- Maven Build Lifecycle Guide
- Frontend Architecture Spec
- Root Maven Project Definition
- Shared Kernel Core Library

## God Nodes (most connected - your core abstractions)
1. `Money` - 13 edges
2. `DateRange` - 11 edges
3. `SecurityConfig` - 8 edges
4. `tools` - 7 edges
5. `tools` - 7 edges
6. `RentaEquiposApplication` - 6 edges
7. `HealthController` - 6 edges
8. `rentals` - 6 edges
9. `rentals` - 6 edges
10. `users` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Spring Boot App Container (Port 8085)` --references--> `RentaEquiposApplication`  [INFERRED]
  docker-compose.yml → bootstrap/src/main/java/com/campus/rentaequipos/RentaEquiposApplication.java
- `Deployment & Verification Guide` --references--> `HealthController`  [EXTRACTED]
  docs/DESPLIEGUE.md → bootstrap/src/main/java/com/campus/rentaequipos/infrastructure/adapter/in/rest/HealthController.java
- `Spring Security JWT Spec` --implements--> `SecurityConfig`  [EXTRACTED]
  docs/ejercicioDemo.md → bootstrap/src/main/java/com/campus/rentaequipos/infrastructure/config/SecurityConfig.java
- `Hexagonal & DDD Architecture Spec` --conceptually_related_to--> `bootstrap`  [INFERRED]
  docs/ejercicioDemo.md → bootstrap/pom.xml
- `Billing & Payments Domain Spec` --references--> `billing`  [EXTRACTED]
  docs/ejercicioDemo.md → billing/pom.xml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Modular Domains** — docs_ejerciciodemo_identity_domain, docs_ejerciciodemo_catalog_domain, docs_ejerciciodemo_rentals_domain, docs_ejerciciodemo_billing_domain, docs_ejerciciodemo_reporting_domain [INFERRED 0.95]
- **Infrastructure & Deployment Stack** — docker_compose_postgres_service, docker_compose_app_service, bootstrap_src_main_resources_application_yml_config [INFERRED 0.95]

## Communities (29 total, 12 thin omitted)

### Community 0 - "Flyway Schema & Relational Tables"
Cohesion: 0.19
Nodes (19): Spring Boot Configuration & Flyway Profile, categories, client_profiles, damage_reports, invoices, payments, provider_profiles, rental_inspections (+11 more)

### Community 1 - "Security & OpenAPI Infrastructure"
Cohesion: 0.19
Nodes (13): OpenApiConfig, SecurityConfig, Spring Security JWT Spec, io.swagger.v3.oas.models.OpenAPI, OpenAPI, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity (+5 more)

### Community 2 - "Relational Schema 4NF Definition"
Cohesion: 0.28
Nodes (15): categories, client_profiles, damage_reports, invoices, payments, provider_profiles, rental_inspections, rental_items (+7 more)

### Community 5 - "Health Endpoints & Deployment Verification"
Cohesion: 0.33
Nodes (8): HealthController, Deployment & Verification Guide, io.swagger.v3.oas.annotations.Operation, io.swagger.v3.oas.annotations.tags.Tag, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.GetMapping, org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController

### Community 6 - "Maven Wrapper Automation"
Cohesion: 0.33
Nodes (6): mvnw script, clean(), die(), exec_maven(), set_java_home(), verbose()

### Community 7 - "Domain Exception Hierarchy"
Cohesion: 0.22
Nodes (3): BusinessRuleViolationException, DomainException, EntityNotFoundException

### Community 8 - "Bootstrap Application & Container Lifecycle"
Cohesion: 0.43
Nodes (5): RentaEquiposApplication, Spring Boot App Container (Port 8085), org.springframework.boot.autoconfigure.domain.EntityScan, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaRepositories

### Community 9 - "Security Role & RBAC Authorities"
Cohesion: 0.33
Nodes (4): Role, ROLE_ADMIN, ROLE_CLIENTE, ROLE_PROVEEDOR

### Community 10 - "Context Integration Tests"
Cohesion: 0.60
Nodes (3): RentaEquiposApplicationTests, org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest

### Community 11 - "Hexagonal Architecture Specification"
Cohesion: 0.67
Nodes (3): Hexagonal & DDD Architecture Spec, bootstrap, Project Architecture & Directory Layout

## Knowledge Gaps
- **26 isolated node(s):** `billing`, `bootstrap`, `catalog`, `identity`, `ROLE_ADMIN` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `billing`, `bootstrap`, `catalog` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._