pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        SONAR_HOST_URL = 'http://sonarqube:9000'
        DOCKER_NETWORK = 'dev-net'
    }

    stages {
        stage('Build, Test & Coverage (Parallel)') {
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
    }

    post {
        success {
            echo 'Build, tests, coverage, and SonarQube analysis succeeded!'
        }
        failure {
            echo 'Pipeline failed. Check build or SonarQube logs above.'
        }
    }
}
