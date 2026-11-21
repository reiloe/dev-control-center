package de.reilo.controlcenter.snapshot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/snapshots")
@CrossOrigin(origins = "http://localhost:5173")
public class SnapshotController {

    private final SnapshotService snapshotService;

    public SnapshotController(SnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> triggerSnapshot() throws Exception {
        return ResponseEntity.ok(snapshotService.createAndNotifySnapshot());
    }
}
