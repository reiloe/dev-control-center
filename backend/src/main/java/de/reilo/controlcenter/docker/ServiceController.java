package de.reilo.controlcenter.docker;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "http://localhost:5173")
public class ServiceController {

    private final DockerService dockerService;

    public ServiceController(DockerService dockerService) {
        this.dockerService = dockerService;
    }

    @GetMapping
    public List<ServiceStatusDto> listServices() {
        return dockerService.getAllServiceStatuses();
    }

    @PostMapping("/{containerName}/start")
    public ResponseEntity<Map<String, String>> startService(@PathVariable String containerName) {
        dockerService.startContainer(containerName);
        return ResponseEntity.ok(Map.of("status", "started", "container", containerName));
    }

    @PostMapping("/{containerName}/stop")
    public ResponseEntity<Map<String, String>> stopService(@PathVariable String containerName) {
        dockerService.stopContainer(containerName);
        return ResponseEntity.ok(Map.of("status", "stopped", "container", containerName));
    }

    @GetMapping("/{containerName}/logs")
    public List<String> getLogs(
            @PathVariable String containerName,
            @RequestParam(defaultValue = "100") int tail
    ) {
        return dockerService.getContainerLogs(containerName, tail);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleUnknownContainer(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
