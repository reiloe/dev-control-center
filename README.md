# DevOps Control Center

[![GitHub Actions CI](https://img.shields.io/github/actions/workflow/status/reiloe/dev-control-center/ci.yml?branch=main&style=for-the-badge&logo=github&label=GitHub%20CI)](https://github.com/reiloe/dev-control-center/actions/workflows/ci.yml)
[![GitLab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/reilo2401%2Fdev-control-center?branch=main&style=for-the-badge&logo=gitlab&label=GitLab%20CI)](https://gitlab.com/reilo2401/dev-control-center/-/pipelines)

![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19_%7C_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Keycloak](https://img.shields.io/badge/Keycloak-OAuth2_%2F_OIDC-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A fullstack infrastructure management dashboard built with **Java 21 / Spring Boot** and **React / TypeScript** to monitor, control, and audit local Docker Compose services in real time.

---

## Local Infrastructure & CI/CD Setup

This project relies on my shared, multi-architecture (`arm64` / `amd64`) local infrastructure stack and CI/CD templates:

* **Local Infrastructure & DevSecOps Stack:** Powered by [`dev-environment`](https://github.com/reiloe/dev-environment) ([GitLab Mirror](https://gitlab.com/reilo2401/dev-environment)) — provides on-demand Docker Compose profiles for databases, caching, messaging, cloud emulators, observability, and DevSecOps tools.
* **Build & Pipeline Reference:** Follows the dual-build (Maven & Gradle Kotlin DSL) and multi-CI/CD structure demonstrated in [`demo-java-app`](https://github.com/reiloe/demo-java-app) ([GitLab Mirror](https://gitlab.com/reilo2401/demo-java-app)).

---

## Architecture & Sub-Projects

* **[`backend/`](backend/README.md):** Spring Boot 3.5 REST API (Java 21) communicating directly with the local Docker Engine socket (`docker-java`), exposing Prometheus metrics via Actuator, and persisting audit logs & snapshots.
* **[`frontend/`](frontend/README.md):** React 19 + TypeScript + Vite + Tailwind CSS dashboard featuring live 5-second status polling, profile filtering, container start/stop controls, and a live log viewer modal.

---

## Quick Start

### 1. Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/reiloe/dev-control-center.git

# Or clone from GitLab
git clone https://gitlab.com/reilo2401/dev-control-center.git

cd dev-control-center
```

### 2. Start Required Infrastructure (`dev-environment`)

Start the `postgres`, `redis`, `seaweedfs`, `mailpit`, and `keycloak` profiles via `./start.sh` in [`dev-environment`](https://gitlab.com/reilo2401/dev-environment). The Keycloak realm `dev-control-center` and test users are provisioned automatically on startup.

### 3. Run Backend & Frontend Locally

```bash
# Terminal 1: Start Spring Boot Backend (port 8080)
cd backend
./mvnw spring-boot:run

# Terminal 2: Start React Frontend (port 5173)
cd frontend
npm install
npm run dev
```

### 4. Build Multi-Arch Container Images (Optional)

Both sub-projects include hardened multi-stage `Dockerfile` definitions (`arm64` / `amd64`) running as non-root users with built-in health checks:

```bash
# Build backend image (Spring Boot 3.5 / JRE 21)
docker build -t localhost:5050/dev-control-center-backend:1.0.0 ./backend

# Build frontend image (React / Nginx Unprivileged on port 8080)
docker build -t localhost:5050/dev-control-center-frontend:1.0.0 ./frontend
```

Open `http://localhost:5173` in your browser.

### 5. Sign In (`http://localhost:5173`)

| Username | Password | Role(s) | Permissions |
| :--- | :--- | :--- | :--- |
| `admin-user` | `admin123` | `ADMIN`, `VIEWER` | Full access: view status/logs/audit, start/stop containers, trigger S3 snapshots |
| `viewer-user` | `viewer123` | `VIEWER` | Read-only access: view status, live container logs, and audit history |

---

## Local Git Pre-Commit Hook (Optional)

This repository includes a versioned pre-commit hook (`scripts/pre-commit`) that automatically updates the project tree in `README.md` and validates JSON configs, `docker-compose.yml` profiles, shell scripts (`shellcheck`), and the custom `Dockerfile` (`hadolint`) before each commit:

```bash
cp scripts/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

---

## Project Structure

<!-- TREE_START -->
```text
dev-control-center/
├── .github
│   └── workflows
│       └── ci.yml
├── backend
│   ├── .sonar
│   │   └── spring-context-model.json
│   ├── gradle
│   │   ├── wrapper
│   │   │   ├── gradle-wrapper.jar
│   │   │   └── gradle-wrapper.properties
│   │   └── libs.versions.toml
│   ├── src
│   │   ├── main
│   │   │   ├── java
│   │   │   │   └── de
│   │   │   │       └── reilo
│   │   │   │           └── controlcenter
│   │   │   │               ├── audit
│   │   │   │               │   ├── AuditController.java
│   │   │   │               │   ├── AuditEvent.java
│   │   │   │               │   └── AuditEventRepository.java
│   │   │   │               ├── config
│   │   │   │               │   ├── DockerClientConfig.java
│   │   │   │               │   └── SecurityConfig.java
│   │   │   │               ├── docker
│   │   │   │               │   ├── DockerService.java
│   │   │   │               │   ├── ServiceController.java
│   │   │   │               │   └── ServiceStatusDto.java
│   │   │   │               ├── snapshot
│   │   │   │               │   ├── SnapshotController.java
│   │   │   │               │   └── SnapshotService.java
│   │   │   │               └── ControlCenterApplication.java
│   │   │   └── resources
│   │   │       └── application.yml
│   │   └── test
│   │       ├── java
│   │       │   └── de
│   │       │       └── reilo
│   │       │           └── controlcenter
│   │       │               └── docker
│   │       │                   └── DockerServiceTest.java
│   │       └── resources
│   │           └── application.yml
│   ├── .dockerignore
│   ├── build.gradle.kts
│   ├── Dockerfile
│   ├── gradlew
│   ├── gradlew.bat
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── README.md
│   └── settings.gradle.kts
├── frontend
│   ├── public
│   │   └── favicon.svg
│   ├── src
│   │   ├── api
│   │   │   ├── servicesApi.test.ts
│   │   │   └── servicesApi.ts
│   │   ├── auth
│   │   │   └── keycloak.ts
│   │   ├── components
│   │   │   ├── AuditDrawer.tsx
│   │   │   └── LogModal.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── sonar-project.properties
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── scripts
│   ├── pre-commit
│   └── update-tree.py
├── .gitignore
├── .gitlab-ci.yml
├── docker-compose.yml
├── Jenkinsfile
├── LICENSE
└── README.md
```
<!-- TREE_END -->

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Author

* **GitHub:** [@reiloe](https://github.com/reiloe)
* **GitLab:** [@reilo2401](https://gitlab.com/reilo2401)
