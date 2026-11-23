pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        SONAR_HOST_URL = 'http://sonarqube:9000'
        DOCKER_NETWORK = 'dev-environment_dev-net'
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

                stage('Frontend (React, ESLint, Vitest & Build)') {
                    agent {
                        docker {
                            image 'node:22-alpine'
                            args '-e NPM_CONFIG_CACHE=/tmp/.npm'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run test:coverage'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Frontend SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        docker run --rm \
                          --network ${DOCKER_NETWORK} \
                          -e SONAR_HOST_URL=${SONAR_HOST_URL} \
                          -e SONAR_TOKEN=${SONAR_TOKEN} \
                          -v "${WORKSPACE}/frontend:/usr/src" \
                          sonarsource/sonar-scanner-cli:latest
                    '''
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
