# ==============================================================================
# Multi-stage Dockerfile for Spring Boot Application
# ==============================================================================

# Stage 1: Build the application with Maven
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and dependencies specification
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Convert CRLF to LF (safe for Windows checkouts) and ensure execute permissions
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Cache dependencies offline
RUN ./mvnw dependency:go-offline -B

# Copy source code and build jar without running tests
COPY src/ ./src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Install curl for container health checks
RUN apk --no-cache add curl

# Create non-root application user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy executable jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

# Run with non-root privileges
USER appuser

EXPOSE 8080

# Configure JVM flags optimized for container environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
