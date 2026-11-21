# DevOps Control Center

[![GitHub Actions CI](https://img.shields.io/github/actions/workflow/status/reiloe/dev-control-center/ci.yml?branch=main&style=for-the-badge&logo=github&label=GitHub%20CI)](https://github.com/reiloe/dev-control-center/actions/workflows/ci.yml)
[![GitLab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/reilo2401%2Fdev-control-center?branch=main&style=for-the-badge&logo=gitlab&label=GitLab%20CI)](https://gitlab.com/reilo2401/dev-control-center/-/pipelines)

![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19_%7C_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)
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

### 2. Run Backend & Frontend Locally

```bash
# Terminal 1: Start Spring Boot Backend (port 8080)
cd backend
./mvnw spring-boot:run

# Terminal 2: Start React Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

<!-- TREE_START -->
```text
dev-control-center/
├── .github
│   └── workflows
│       └── ci.yml
├── backend
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
│   │   │   │               ├── config
│   │   │   │               │   └── DockerClientConfig.java
│   │   │   │               ├── docker
│   │   │   │               │   ├── DockerService.java
│   │   │   │               │   ├── ServiceController.java
│   │   │   │               │   └── ServiceStatusDto.java
│   │   │   │               └── ControlCenterApplication.java
│   │   │   └── resources
│   │   │       └── application.yml
│   │   └── test
│   │       └── java
│   │           └── de
│   │               └── reilo
│   │                   └── controlcenter
│   │                       └── docker
│   │                           └── DockerServiceTest.java
│   ├── build.gradle.kts
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
│   │   │   └── servicesApi.ts
│   │   ├── components
│   │   │   └── LogModal.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── scripts
│   └── update-tree.py
├── .gitlab-ci.yml
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
