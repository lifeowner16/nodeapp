pipeline {
    agent {
        kubernetes {
            label 'k8s-agent'
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: nodeapp-agent
spec:
  containers:
  - name: node
    image: node:20-alpine
    command:
    - sleep
    args:
    - infinity
  - name: docker
    image: docker:27-cli
    command:
    - sleep
    args:
    - infinity
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
      type: Socket
"""
        }
    }

    environment {
        APP_NAME = 'simple-node-jenkins'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                container('node') {
                    echo "Checking out ${env.GIT_BRANCH ?: 'local branch'}"
                }
            }
        }

        stage('Install') {
            steps {
                container('node') {
                    sh 'npm install'
                }
            }
        }

        stage('Test') {
            steps {
                container('node') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                container('docker') {
                    sh """
                      docker build -t ${APP_NAME}:${IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Smoke Test Container') {
            steps {
                container('docker') {
                    sh """
                      docker run -d --name ${APP_NAME}-test -p 3000:3000 ${APP_NAME}:${IMAGE_TAG}
                      sleep 5
                      docker exec ${APP_NAME}-test wget -qO- http://localhost:3000/health
                      docker stop ${APP_NAME}-test
                      docker rm ${APP_NAME}-test
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded.'
        }

        failure {
            echo 'Pipeline failed.'
        }

        always {
            container('docker') {
                sh 'docker rm -f ${APP_NAME}-test || true'
            }
        }
    }
}
