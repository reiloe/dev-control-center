package de.reilo.controlcenter.config;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@Configuration
public class DockerClientConfig {

    @Bean
    public DockerClient dockerClient(@Value("${docker.host:}") String configuredHost) {
        String dockerHost = resolveDockerHost(configuredHost);

        var config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(dockerHost)
                .build();

        var httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(50)
                .connectionTimeout(Duration.ofSeconds(5))
                .responseTimeout(Duration.ofSeconds(15))
                .build();

        return DockerClientImpl.getInstance(config, httpClient);
    }

    private String resolveDockerHost(String configuredHost) {
        if (configuredHost != null && !configuredHost.isBlank()) {
            return configuredHost;
        }
        Path macDesktopSocket = Path.of(System.getProperty("user.home"), ".docker", "run", "docker.sock");
        if (Files.exists(macDesktopSocket)) {
            return "unix://" + macDesktopSocket.toAbsolutePath();
        }
        return "unix:///var/run/docker.sock";
    }
}
