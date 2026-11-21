package de.reilo.controlcenter.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String containerName;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private Instant occurredAt;

    protected AuditEvent() {}

    public AuditEvent(String containerName, String action, String actor, Instant occurredAt) {
        this.containerName = containerName;
        this.action = action;
        this.actor = actor;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public String getContainerName() { return containerName; }
    public String getAction() { return action; }
    public String getActor() { return actor; }
    public Instant getOccurredAt() { return occurredAt; }
}
