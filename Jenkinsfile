pipeline {
  agent none
  options { timestamps(); timeout(time: 15, unit: 'MINUTES') }
  environment {
    IMAGE = 'registry:5000/order-service'
  }
  stages {
    stage('Checkout') {
      agent any
      steps {
        checkout scm
        stash name: 'src', excludes: 'node_modules/**'
      }
    }

    stage('Install & test') {
      // Distinct label from the CasC-registered 'k8s-agent' template (plain inbound-agent,
      // no extra containers) -- reusing the same label would let Jenkins schedule either
      // pod template non-deterministically for any job that asks for 'k8s-agent'.
      agent {
        kubernetes {
          label 'k8s-build-agent'
          yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: order-service-build-agent
spec:
  containers:
  - name: node
    image: node:20-alpine
    command: ["sleep"]
    args: ["infinity"]
'''
        }
      }
      steps {
        unstash 'src'
        container('node') {
          sh 'npm ci'
          sh 'npm test'
        }
        stash name: 'tested', excludes: 'node_modules/**'
      }
    }

    stage('Build') {
      agent any
      steps {
        unstash 'tested'
        sh 'docker build -t "$IMAGE:$BUILD_NUMBER" -t "$IMAGE:latest" .'
      }
    }

    stage('Push') {
      agent any
      steps {
        sh 'docker push "$IMAGE:$BUILD_NUMBER"'
        sh 'docker push "$IMAGE:latest"'
      }
    }

    stage('Smoke test') {
      agent any
      steps {
        sh '''
          docker run -d --name order-service-smoke-$BUILD_NUMBER -p 3000:3000 "$IMAGE:$BUILD_NUMBER"
          sleep 3
          docker exec order-service-smoke-$BUILD_NUMBER wget -qO- http://localhost:3000/health/live
        '''
      }
      post {
        always {
          sh 'docker rm -f order-service-smoke-$BUILD_NUMBER || true'
        }
      }
    }
  }

  post {
    success { echo 'Pipeline succeeded.' }
    failure { echo 'Pipeline failed.' }
  }
}
