plugins {
    java
    jacoco
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
}

group = "de.reilo"
version = "1.0.0"

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
    implementation(libs.micrometer.registry.prometheus)
    implementation(libs.docker.java.core)
    implementation(libs.docker.java.transport)

    constraints {
        implementation(libs.commons.io) {
            because("Fixes CVE-2024-47554 in transitive commons-io from docker-java")
        }
    }

    testImplementation(libs.spring.boot.starter.test)
}

jacoco {
    toolVersion = libs.versions.jacoco.get()
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

