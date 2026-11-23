plugins {
    java
    jacoco
    `maven-publish`
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
    alias(libs.plugins.sonarqube)
}

group = "de.reilo"
version = "1.0.0-SNAPSHOT"

publishing {
    publications {
        create("mavenJava", MavenPublication::class.java) {
            artifact(tasks.bootJar)
        }
    }
    repositories {
        maven {
            val nexusBaseUrl = System.getenv("NEXUS_URL") ?: "http://localhost:8087"
            val isSnapshot = version.toString().endsWith("SNAPSHOT")
            url = uri(
                if (isSnapshot) "$nexusBaseUrl/repository/maven-snapshots/"
                else "$nexusBaseUrl/repository/maven-releases/"
            )
            isAllowInsecureProtocol = true
            credentials {
                username = System.getenv("NEXUS_USER") ?: "admin"
                password = System.getenv("NEXUS_PASS") ?: ""
            }
        }
    }
}


java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(libs.versions.java.get().toInt())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.cache)
    implementation(libs.spring.boot.starter.data.redis)
    implementation(libs.spring.boot.starter.mail)
    implementation(libs.spring.boot.starter.oauth2.resource.server)
    implementation(libs.micrometer.registry.prometheus)
    implementation(libs.docker.java.core)
    implementation(libs.docker.java.transport)
    implementation(libs.aws.s3)

    runtimeOnly(libs.postgresql)

    constraints {
        implementation(libs.commons.io) {
            because("Fixes CVE-2024-47554 in transitive commons-io from docker-java")
        }
    }

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.security.test)
    testRuntimeOnly(libs.h2)
}

configurations.all {
    exclude(group = "commons-logging", module = "commons-logging")
}


jacoco {
    toolVersion = libs.versions.jacoco.get()
}

sonar {
    properties {
        property("sonar.projectKey", "dev-control-center-backend")
        property("sonar.projectName", "DevOps Control Center - Backend")
        property(
            "sonar.coverage.jacoco.xmlReportPaths",
            layout.buildDirectory.file("reports/jacoco/test/jacocoTestReport.xml").get().asFile.absolutePath
        )
    }
}


tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude("de/reilo/controlcenter/ControlCenterApplication.class")
            }
        })
    )
}

