package de.reilo.controlcenter.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.ListContainersCmd;
import com.github.dockerjava.api.command.StartContainerCmd;
import com.github.dockerjava.api.command.StopContainerCmd;
import com.github.dockerjava.api.model.Container;
import de.reilo.controlcenter.audit.AuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DockerServiceTest {

    @Mock
    private DockerClient dockerClient;

    @Mock private AuditEventRepository auditEventRepository;

    @Mock
    private ListContainersCmd listContainersCmd;

    private DockerService dockerService;

    @BeforeEach
    void setUp() {
        dockerService = new DockerService(dockerClient, auditEventRepository);
    }

    @Test
    void getAllServiceStatuses_mapsRunningAndMissingContainers() {
        Container postgresContainer = mock(Container.class);
        when(postgresContainer.getNames()).thenReturn(new String[]{"/dev-postgres"});
        when(postgresContainer.getState()).thenReturn("running");
        when(postgresContainer.getStatus()).thenReturn("Up 2 hours");

        when(dockerClient.listContainersCmd()).thenReturn(listContainersCmd);
        when(listContainersCmd.withShowAll(true)).thenReturn(listContainersCmd);
        when(listContainersCmd.exec()).thenReturn(List.of(postgresContainer));

        List<ServiceStatusDto> statuses = dockerService.getAllServiceStatuses();

        ServiceStatusDto postgres = statuses.stream()
                .filter(s -> s.containerName().equals("dev-postgres"))
                .findFirst()
                .orElseThrow();

        assertEquals("RUNNING", postgres.state());
        assertEquals("Up 2 hours", postgres.statusText());

        ServiceStatusDto redis = statuses.stream()
                .filter(s -> s.containerName().equals("dev-redis"))
                .findFirst()
                .orElseThrow();

        assertEquals("NOT_CREATED", redis.state());
    }

    @Test
    void startContainer_knownContainer_invokesDockerStart() {
        StartContainerCmd startCmd = mock(StartContainerCmd.class);
        when(dockerClient.startContainerCmd("dev-redis")).thenReturn(startCmd);

        dockerService.startContainer("dev-redis");

        verify(startCmd).exec();
    }

    @Test
    void stopContainer_unknownContainer_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> dockerService.stopContainer("malicious-container"));
        verifyNoInteractions(dockerClient);
    }
}
