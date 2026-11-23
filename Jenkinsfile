pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 25, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        booleanParam(
            name: 'PUSH_PRIVATE_REGISTRY',
            defaultValue: true,
            description: 'Push Docker images to local Private Docker Registry (localhost:5050)'
        )
        booleanParam(
            name: 'PUSH_NEXUS_DOCKER',
            defaultValue: false,
            description: 'Push Docker images to Nexus Docker Hosted Registry (localhost:8088)'
        )
        booleanParam(
            name: 'CREATE_RELEASE',
            defaultValue: false,
            description: 'Build & publish a final RELEASE version to Nexus instead of SNAPSHOT'
        )
        string(
            name: 'RELEASE_VERSION',
            defaultValue: '',
            description: 'Release version (e.g. 1.0.0) - required when CREATE_RELEASE is checked'
        )

    }

    environment {
        SONAR_HOST_URL        = 'http://sonarqube:9000'
        DOCKER_NETWORK        = 'dev-net'
        PRIVATE_REGISTRY      = 'localhost:5050'
        NEXUS_DOCKER_REGISTRY = 'localhost:8088'
        NEXUS_URL             = 'http://nexus:8081'
    }

    stages {
        stage('Prepare Versions') {
            steps {
                script {
                    if (params.CREATE_RELEASE) {
                        if (!params.RELEASE_VERSION?.trim()) {
                            error('RELEASE_VERSION must be specified when CREATE_RELEASE is enabled!')
                        }
                        def rel = params.RELEASE_VERSION.trim()
                        env.MAVEN_VERSION = rel
                        env.NPM_VERSION   = rel
                        env.DOCKER_TAG    = rel
                    } else {
                        def pomVer = sh(
                            script: "grep -m1 '<version>' backend/pom.xml | sed -E 's/.*<version>([^<]+)<\\/version>.*/\\1/'",
                            returnStdout: true
                        ).trim()
                        def baseVer = pomVer.replace('-SNAPSHOT', '')
                        env.MAVEN_VERSION = pomVer
                        env.NPM_VERSION   = "${baseVer}-snapshot.${env.BUILD_NUMBER}"
                        env.DOCKER_TAG    = "${baseVer}-SNAPSHOT-${env.BUILD_NUMBER}"
                    }
                    echo "Resolved versions -> Maven: ${env.MAVEN_VERSION} | npm: ${env.NPM_VERSION} | Docker: ${env.DOCKER_TAG}"
                }
            }
        }

        stage('Build, Test & SonarQube Analysis (Parallel)') {
            parallel {
                stage('Backend (Java 21, JaCoCo & SonarQube)') {
                    agent {
                        docker {
                            image 'eclipse-temurin:21-jdk'
                            args "-e MAVEN_USER_HOME=/tmp/.m2 --network ${DOCKER_NETWORK}"
                            reuseNode true
                        }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')]) {
                            dir('backend') {
                                sh '''
                                    ./mvnw -B versions:set -DnewVersion=${MAVEN_VERSION} -DgenerateBackupPoms=false
                                    ./mvnw -B clean verify sonar:sonar \
                                      -Dsonar.host.url=${SONAR_HOST_URL} \
                                      -Dsonar.token=${SONAR_TOKEN}
                                '''
                            }
                        }
                    }
                    post {
                        always {
                            junit 'backend/target/surefire-reports/*.xml'
                        }
                    }
                }

                stage('Frontend (React, ESLint, Vitest & SonarQube)') {
                    agent {
                        docker {
                            image 'node:22-bookworm-slim'
                            args "-e NPM_CONFIG_CACHE=/tmp/.npm --network ${DOCKER_NETWORK}"
                            reuseNode true
                        }
                    }
                    steps {
                        withCredentials([string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')]) {
                            dir('frontend') {
                                sh '''
                                    npm ci
                                    npm run lint
                                    npm run test:coverage
                                    npm run build
                                    npx --yes @sonar/scan \
                                      -Dsonar.host.url=${SONAR_HOST_URL} \
                                      -Dsonar.token=${SONAR_TOKEN}
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy Code Artifacts to Nexus (Parallel)') {
            parallel {
                stage('Publish Backend JAR (Maven)') {
                    agent {
                        docker {
                            image 'eclipse-temurin:21-jdk'
                            args "-e HOME=/tmp -e MAVEN_USER_HOME=/tmp/.m2 --network ${DOCKER_NETWORK}"
                            reuseNode true
                        }
                    }
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: 'nexus',
                            usernameVariable: 'NEXUS_USER',
                            passwordVariable: 'NEXUS_PASS'
                        )]) {
                            dir('backend') {
                                sh '''
                                    cat <<EOF > /tmp/maven-settings.xml
<settings>
  <servers>
    <server>
      <id>nexus-releases</id>
      <username>${NEXUS_USER}</username>
      <password>${NEXUS_PASS}</password>
      <repositoryOrigins>
        <repositoryOrigin>http://nexus:8081</repositoryOrigin>
      </repositoryOrigins>
    </server>
    <server>
      <id>nexus-snapshots</id>
      <username>${NEXUS_USER}</username>
      <password>${NEXUS_PASS}</password>
      <repositoryOrigins>
        <repositoryOrigin>http://nexus:8081</repositoryOrigin>
      </repositoryOrigins>
    </server>
  </servers>
</settings>
EOF
                                    ./mvnw -B deploy -DskipTests \
                                      -s /tmp/maven-settings.xml \
                                      -Dmaven.repo.local=.m2-repo \
                                      -Drevision=${IMAGE_TAG}
                                '''
                    }
                }
            }
        }

        stage('Publish Frontend Package (npm)') {
            agent {
                docker {
                    image 'node:22-bookworm-slim'
                     args "-e NPM_CONFIG_CACHE=/tmp/.npm --network ${DOCKER_NETWORK}"
                     reuseNode true
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {
                    dir('frontend') {
                        sh '''
                            AUTH_B64=$(printf "%s:%s" "$NEXUS_USER" "$NEXUS_PASS" | base64 | tr -d '\\n')
                            cat <<EOF > /tmp/.npmrc
registry=${NEXUS_URL}/repository/npm-hosted/
//nexus:8081/repository/npm-hosted/:_auth=${AUTH_B64}
EOF
                                    npm version "${NPM_VERSION}" --no-git-tag-version --allow-same-version
                                    npm publish --userconfig /tmp/.npmrc
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Images') {
            when {
                expression { return params.PUSH_PRIVATE_REGISTRY || params.PUSH_NEXUS_DOCKER }
            }
            steps {
                script {
                    sh "docker build --pull=false -t dev-control-center-backend:${DOCKER_TAG} ./backend"
                    sh "docker build --pull=false -t dev-control-center-frontend:${DOCKER_TAG} ./frontend"


                    if (params.PUSH_PRIVATE_REGISTRY) {
                        sh """
                            docker tag dev-control-center-backend:${DOCKER_TAG} ${PRIVATE_REGISTRY}/dev-control-center-backend:${DOCKER_TAG}
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-backend:${DOCKER_TAG}

                            docker tag dev-control-center-frontend:${DOCKER_TAG} ${PRIVATE_REGISTRY}/dev-control-center-frontend:${DOCKER_TAG}
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-frontend:${DOCKER_TAG}
                        """
                        if (params.CREATE_RELEASE) {
                            sh """
                                docker tag dev-control-center-backend:${DOCKER_TAG} ${PRIVATE_REGISTRY}/dev-control-center-backend:latest
                                docker push ${PRIVATE_REGISTRY}/dev-control-center-backend:latest

                                docker tag dev-control-center-frontend:${DOCKER_TAG} ${PRIVATE_REGISTRY}/dev-control-center-frontend:latest
                                docker push ${PRIVATE_REGISTRY}/dev-control-center-frontend:latest
                            """
                        }
                    }

                    if (params.PUSH_NEXUS_DOCKER) {
                        withCredentials([usernamePassword(
                            credentialsId: 'nexus',
                            usernameVariable: 'NEXUS_USER',
                            passwordVariable: 'NEXUS_PASS'
                        )]) {
                            sh """
                                echo "\$NEXUS_PASS" | docker login ${NEXUS_DOCKER_REGISTRY} -u "\$NEXUS_USER" --password-stdin

                                docker tag dev-control-center-backend:${DOCKER_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:${DOCKER_TAG}
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:${DOCKER_TAG}

                                docker tag dev-control-center-frontend:${DOCKER_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:${DOCKER_TAG}
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:${DOCKER_TAG}
                            """
                            if (params.CREATE_RELEASE) {
                                sh """
                                    docker tag dev-control-center-backend:${DOCKER_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:latest
                                    docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:latest

                                    docker tag dev-control-center-frontend:${DOCKER_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:latest
                                    docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:latest
                                """
                            }
                            sh "docker logout ${NEXUS_DOCKER_REGISTRY}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Published artifacts (${MAVEN_VERSION} / ${NPM_VERSION}) and Docker tag (${DOCKER_TAG})."
        }
        failure {
            echo 'Pipeline failed. Check stage logs above.'
        }
    }
}
