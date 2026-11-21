package de.reilo.controlcenter.snapshot;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.reilo.controlcenter.docker.DockerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

@Service
public class SnapshotService {

    private final DockerService dockerService;
    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;
    private final S3Client s3Client;
    private final String bucketName;

    public SnapshotService(
            DockerService dockerService,
            ObjectMapper objectMapper,
            JavaMailSender mailSender,
            @Value("${storage.s3.endpoint}") String endpoint,
            @Value("${storage.s3.region}") String region,
            @Value("${storage.s3.access-key}") String accessKey,
            @Value("${storage.s3.secret-key}") String secretKey,
            @Value("${storage.s3.bucket}") String bucketName
    ) {
        this.dockerService = dockerService;
        this.objectMapper = objectMapper;
        this.mailSender = mailSender;
        this.bucketName = bucketName;
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();
    }

    public Map<String, String> createAndNotifySnapshot() throws Exception {
        ensureBucketExists();

        String timestamp = Instant.now().toString().replace(":", "-");
        String objectKey = "snapshot-" + timestamp + ".json";
        String jsonPayload = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(dockerService.getAllServiceStatuses());

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .contentType("application/json")
                        .build(),
                RequestBody.fromBytes(jsonPayload.getBytes(StandardCharsets.UTF_8))
        );

        sendMailpitNotification(objectKey);

        return Map.of(
                "bucket", bucketName,
                "objectKey", objectKey,
                "notification", "Sent via Mailpit"
        );
    }

    private void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (Exception ignored) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
        }
    }

    private void sendMailpitNotification(String objectKey) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("control-center@localhost");
        message.setTo("admin@localhost");
        message.setSubject("DevOps Control Center Snapshot: " + objectKey);
        message.setText("A new infrastructure snapshot has been archived to SeaweedFS (S3) bucket '"
                + bucketName + "' under key '" + objectKey + "'.");
        mailSender.send(message);
    }

}
