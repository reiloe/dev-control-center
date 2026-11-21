package de.reilo.controlcenter.docker;

import java.io.Serializable;

public record ServiceStatusDto(
        String containerName,
        String serviceName,
        String profile,
        String state,
        String statusText,
        String webUiUrl
) implements Serializable {}
