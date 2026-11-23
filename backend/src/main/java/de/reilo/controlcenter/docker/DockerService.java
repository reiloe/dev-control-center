package de.reilo.controlcenter.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Frame;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class DockerService {

    private record ServiceDefinition(String containerName, String displayName, String profile, String webUiUrl) {}

    private static final List<ServiceDefinition> KNOWN_SERVICES = List.of(
            new ServiceDefinition("dev-portainer", "Portainer CE", "core", "https://localhost:9443"),
            new ServiceDefinition("dev-forgejo", "Forgejo", "git", "http://localhost:3001"),
            new ServiceDefinition("dev-forgejo-dind", "Forgejo DinD", "git", null),
            new ServiceDefinition("dev-forgejo-runner", "Forgejo Runner", "git", null),
            new ServiceDefinition("dev-bookstack", "BookStack Wiki", "docs", "http://localhost:8089"),
            new ServiceDefinition("dev-bookstack-db", "BookStack MariaDB", "docs", null),
            new ServiceDefinition("dev-postgres", "PostgreSQL", "postgres", null),
            new ServiceDefinition("dev-pgadmin", "pgAdmin 4", "postgres", "http://localhost:8092"),
            new ServiceDefinition("dev-mariadb", "MariaDB", "mariadb", null),
            new ServiceDefinition("dev-adminer", "Adminer", "mariadb", "http://localhost:8082"),
            new ServiceDefinition("dev-mongodb", "MongoDB", "mongodb", null),
            new ServiceDefinition("dev-mongo-express", "Mongo Express", "mongodb", "http://localhost:8081"),
            new ServiceDefinition("dev-redis", "Redis", "redis", null),
            new ServiceDefinition("dev-redisinsight", "Redis Insight", "redis", "http://localhost:8083"),
            new ServiceDefinition("dev-mosquitto", "Eclipse Mosquitto", "mosquitto", null),
            new ServiceDefinition("dev-mqttx-web", "MQTTX Web", "mosquitto", "http://localhost:8084"),
            new ServiceDefinition("dev-prometheus", "Prometheus", "monitoring", "http://localhost:9090"),
            new ServiceDefinition("dev-alertmanager", "Alertmanager", "monitoring", "http://localhost:9093"),
            new ServiceDefinition("dev-grafana", "Grafana", "monitoring", "http://localhost:3000"),
            new ServiceDefinition("dev-mailpit", "Mailpit", "mailpit", "http://localhost:8025"),
            new ServiceDefinition("dev-jenkins", "Jenkins CI/CD", "jenkins", "http://localhost:8085"),
            new ServiceDefinition("dev-sonarqube", "SonarQube", "sonarqube", "http://localhost:9000"),
            new ServiceDefinition("dev-registry", "Docker Registry", "registry", null),
            new ServiceDefinition("dev-registry-ui", "Docker Registry UI", "registry", "http://localhost:8091"),
            new ServiceDefinition("dev-seaweedfs", "SeaweedFS (S3)", "seaweedfs", "http://localhost:9003"),
            new ServiceDefinition("dev-localstack", "LocalStack (AWS)", "localstack", "http://localhost:4566"),
            new ServiceDefinition("dev-keycloak", "Keycloak (OIDC)", "keycloak", "http://localhost:8086"),
            new ServiceDefinition("dev-nexus", "Sonatype Nexus", "nexus", "http://localhost:8087"),
            new ServiceDefinition("dev-vault", "HashiCorp Vault", "vault", "http://localhost:8200"),
            new ServiceDefinition("dev-zap", "OWASP ZAP", "zap", "http://localhost:8090")
    );

    private final DockerClient dockerClient;
    private final de.reilo.controlcenter.audit.AuditEventRepository auditEventRepository;

    public DockerService(
            DockerClient dockerClient,
            de.reilo.controlcenter.audit.AuditEventRepository auditEventRepository
    ) {
        this.dockerClient = dockerClient;
        this.auditEventRepository = auditEventRepository;
    }

    @org.springframework.cache.annotation.Cacheable("serviceStatuses")
    public List<ServiceStatusDto> getAllServiceStatuses() {

        List<Container> containers = dockerClient.listContainersCmd().withShowAll(true).exec();
        Map<String, Container> containerByName = containers.stream()
                .filter(c -> c.getNames() != null && c.getNames().length > 0)
                .collect(Collectors.toMap(
                        c -> java.util.Arrays.stream(c.getNames())
                                .findFirst()
                                .orElse("")
                                .replaceFirst("^/", ""),
                        c -> c,
                        (existing, replacement) -> existing
                ));

        return KNOWN_SERVICES.stream()
                .map(def -> {
                    Container container = containerByName.get(def.containerName());
                    if (container == null) {
                        return new ServiceStatusDto(
                                def.containerName(), def.displayName(), def.profile(),
                                "NOT_CREATED", "Container not initialized", def.webUiUrl()
                        );
                    }
                    return new ServiceStatusDto(
                            def.containerName(), def.displayName(), def.profile(),
                            container.getState().toUpperCase(), container.getStatus(), def.webUiUrl()
                    );
                })
                .toList();
    }

    @org.springframework.cache.annotation.CacheEvict(value = "serviceStatuses", allEntries = true)
    public void startContainer(String containerName) {
        validateKnownContainer(containerName);
        dockerClient.startContainerCmd(containerName).exec();
        auditEventRepository.save(
                new de.reilo.controlcenter.audit.AuditEvent(containerName, "START", currentUsername(), java.time.Instant.now())
        );
    }

    @org.springframework.cache.annotation.CacheEvict(value = "serviceStatuses", allEntries = true)
    public void stopContainer(String containerName) {
        validateKnownContainer(containerName);
        dockerClient.stopContainerCmd(containerName).exec();
        auditEventRepository.save(
                new de.reilo.controlcenter.audit.AuditEvent(containerName, "STOP", currentUsername(), java.time.Instant.now())
        );
    }


    public List<String> getContainerLogs(String containerName, int tailLines) {
        validateKnownContainer(containerName);
        List<String> logLines = new ArrayList<>();
        try {
            dockerClient.logContainerCmd(containerName)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withTail(tailLines)
                    .exec(new ResultCallback.Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            logLines.add(new String(frame.getPayload(), StandardCharsets.UTF_8).trim());
                        }
                    })
                    .awaitCompletion(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while reading logs for " + containerName, e);
        }
        return logLines;
    }

    private void validateKnownContainer(String containerName) {
        boolean isKnown = KNOWN_SERVICES.stream()
                .anyMatch(s -> s.containerName().equals(containerName));
        if (!isKnown) {
            throw new IllegalArgumentException("Unknown or unmanaged container: " + containerName);
        }
    }

    private String currentUsername() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            String preferred = jwt.getClaimAsString("preferred_username");
            return preferred != null ? preferred : jwt.getSubject();
        }
        return "local-dev";
    }
}
