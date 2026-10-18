pipeline {
    agent { 
        label 'k8s-agent' 
    } 

    environment {
        APP_NAME = 'simple-node-jenkins'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out ${env.GIT_BRANCH ?: 'local branch'}"
            }
        }

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                  docker build -t ${APP_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Smoke Test Container') {
            steps {
                sh """
                  docker run -d --name ${APP_NAME}-test -p 3000:3000 ${APP_NAME}:${IMAGE_TAG}
                  sleep 5
                  curl -f http://localhost:3000/health
                  docker stop ${APP_NAME}-test
                  docker rm ${APP_NAME}-test
                """
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
            sh 'docker rm -f ${APP_NAME}-test || true'
        }
    }
}
