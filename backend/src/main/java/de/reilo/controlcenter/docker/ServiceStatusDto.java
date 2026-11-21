package de.reilo.controlcenter.docker;

public record ServiceStatusDto(
        String containerName,
        String serviceName,
        String profile,
        String state,
        String statusText,
        String webUiUrl
) {}
