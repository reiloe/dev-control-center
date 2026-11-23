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
    }

    environment {
        SONAR_HOST_URL        = 'http://sonarqube:9000'
        DOCKER_NETWORK        = 'dev-net'
        PRIVATE_REGISTRY      = 'localhost:5050'
        NEXUS_DOCKER_REGISTRY = 'localhost:8088'
        NEXUS_URL             = 'http://nexus:8081'
        IMAGE_TAG             = "1.0.${env.BUILD_NUMBER}"
    }

    stages {
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
                            args "-e MAVEN_USER_HOME=/tmp/.m2 --network ${DOCKER_NETWORK}"
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
    </server>
  </servers>
</settings>
EOF
                                    ./mvnw -B deploy -DskipTests -s /tmp/maven-settings.xml \
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
                                    npm version ${IMAGE_TAG} --no-git-tag-version
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
                    sh "docker build -t dev-control-center-backend:${IMAGE_TAG} ./backend"
                    sh "docker build -t dev-control-center-frontend:${IMAGE_TAG} ./frontend"

                    if (params.PUSH_PRIVATE_REGISTRY) {
                        sh """
                            docker tag dev-control-center-backend:${IMAGE_TAG} ${PRIVATE_REGISTRY}/dev-control-center-backend:${IMAGE_TAG}
                            docker tag dev-control-center-backend:${IMAGE_TAG} ${PRIVATE_REGISTRY}/dev-control-center-backend:latest
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-backend:${IMAGE_TAG}
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-backend:latest

                            docker tag dev-control-center-frontend:${IMAGE_TAG} ${PRIVATE_REGISTRY}/dev-control-center-frontend:${IMAGE_TAG}
                            docker tag dev-control-center-frontend:${IMAGE_TAG} ${PRIVATE_REGISTRY}/dev-control-center-frontend:latest
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-frontend:${IMAGE_TAG}
                            docker push ${PRIVATE_REGISTRY}/dev-control-center-frontend:latest
                        """
                    }

                    if (params.PUSH_NEXUS_DOCKER) {
                        withCredentials([usernamePassword(
                            credentialsId: 'nexus',
                            usernameVariable: 'NEXUS_USER',
                            passwordVariable: 'NEXUS_PASS'
                        )]) {
                            sh """
                                echo "\$NEXUS_PASS" | docker login ${NEXUS_DOCKER_REGISTRY} -u "\$NEXUS_USER" --password-stdin

                                docker tag dev-control-center-backend:${IMAGE_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:${IMAGE_TAG}
                                docker tag dev-control-center-backend:${IMAGE_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:latest
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:${IMAGE_TAG}
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-backend:latest

                                docker tag dev-control-center-frontend:${IMAGE_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:${IMAGE_TAG}
                                docker tag dev-control-center-frontend:${IMAGE_TAG} ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:latest
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:${IMAGE_TAG}
                                docker push ${NEXUS_DOCKER_REGISTRY}/dev-control-center-frontend:latest

                                docker logout ${NEXUS_DOCKER_REGISTRY}
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Code artifacts deployed to Nexus and selected Docker images published (${IMAGE_TAG})."
        }
        failure {
            echo 'Pipeline failed. Check stage logs above.'
        }
    }
}
