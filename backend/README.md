# DevOps Control Center — Backend

Java 21 + Spring Boot 3.5 OAuth2 Resource Server managing local Docker containers and integrating with **Keycloak**, **PostgreSQL**, **Redis**, **SeaweedFS (S3)**, **Mailpit**, and **Prometheus**.

## Build & Test (Dual Build Setup)

Both **Apache Maven** and **Gradle (Kotlin DSL + Version Catalog)** are supported identically:

```bash
# Using Maven Wrapper
./mvnw clean test
./mvnw spring-boot:run

# Using Gradle Wrapper
./gradlew clean test
./gradlew bootRun
```

## Key Endpoints

All `/api/**` endpoints require a valid Bearer JWT issued by Keycloak (`realm: dev-control-center`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/services` | Returns live status, profile, and Web UI URL for all managed containers |
| `POST` | `/api/services/{containerName}/start` | Starts a stopped container and records an audit event |
| `POST` | `/api/services/{containerName}/stop` | Stops a running container and records an audit event |
| `GET` | `/api/services/{containerName}/logs?tail=100` | Streams the last `N` stdout/stderr log lines |
| `GET` | `/api/audit` | Lists the 50 most recent container control actions |
| `POST` | `/api/snapshots` | Exports a JSON status snapshot to Seaweedfs and sends a Mailpit alert |
| `GET` | `/actuator/prometheus` | Exposes JVM & HTTP metrics for Prometheus scraping |

## Container Build

The multi-stage `Dockerfile` compiles the Spring Boot JAR using Maven and packages it into a minimal `eclipse-temurin:21-jre-jammy` runtime image running as a dedicated non-root user (`appuser`):

```bash
docker build -t localhost:5050/dev-control-center-backend:1.0.0 .
```

---

## Code Quality & Artifact Publishing

* **SonarQube & JaCoCo:** Run `./mvnw clean verify sonar:sonar` (or `./gradlew clean check sonar`) with `SONAR_TOKEN` set to publish test coverage and static analysis metrics.
* **Nexus Maven Deployment:** Configured via `<distributionManagement>` (`maven-releases` & `maven-snapshots`) in `pom.xml` as well as `maven-publish` in `build.gradle.kts` for automated snapshot and release JAR publishing.
