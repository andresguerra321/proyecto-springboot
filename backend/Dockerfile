# ==============================================================================
# Multi-stage Dockerfile for Spring Boot Application (Multi-module)
# ==============================================================================

# Stage 1: Build the application with Maven
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper
COPY .mvn/ .mvn/
COPY mvnw ./

# Convert CRLF to LF and ensure execute permissions
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy all POM files for dependency resolution
COPY pom.xml ./
COPY shared-kernel/pom.xml shared-kernel/
COPY identity/pom.xml identity/
COPY catalog/pom.xml catalog/
COPY rental/pom.xml rental/
COPY billing/pom.xml billing/
COPY reporting/pom.xml reporting/
COPY bootstrap/pom.xml bootstrap/

# Copy all module source codes
COPY shared-kernel/src/ shared-kernel/src/
COPY identity/src/ identity/src/
COPY catalog/src/ catalog/src/
COPY rental/src/ rental/src/
COPY billing/src/ billing/src/
COPY reporting/src/ reporting/src/
COPY bootstrap/src/ bootstrap/src/

# Package executable fat JAR
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Install curl for container health checks
RUN apk --no-cache add curl

# Create non-root application user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy executable jar from bootstrap module in builder stage
COPY --from=builder --chown=appuser:appgroup /app/bootstrap/target/*.jar app.jar

# Run with non-root privileges
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
