pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Build & Test (Parallel)') {
            parallel {
                stage('Backend (Java 21 & Maven)') {
                    agent {
                        docker {
                            image 'eclipse-temurin:21-jdk'
                            args '-e MAVEN_USER_HOME=/tmp/.m2'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('backend') {
                            sh './mvnw -B clean verify'
                        }
                    }
                    post {
                        always {
                            junit 'backend/target/surefire-reports/*.xml'
                        }
                    }
                }

                stage('Frontend (React & TypeScript)') {
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
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Build and test pipeline succeeded!'
        }
        failure {
            echo 'Build or test stage failed. Check logs above.'
        }
    }
}
