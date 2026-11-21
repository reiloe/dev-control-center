package de.reilo.controlcenter.audit;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "http://localhost:5173")
public class AuditController {

    private final AuditEventRepository repository;

    public AuditController(AuditEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<AuditEvent> recentEvents() {
        return repository.findTop50ByOrderByOccurredAtDesc();
    }
}
