pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out code...'
                checkout scm
            }
        }

        stage('Setup Node') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'

                sh '''
                if [ -f package-lock.json ]; then
                  npm ci
                else
                  npm install
                fi
                '''
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint --if-present'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test --if-present'
            }
        }

        stage('Build Next.js App') {
            steps {
                echo '🏗️ Building Next.js app...'
                sh 'npm run build'
            }
        }

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: '.next/**', fingerprint: true
            }
        }

        stage('Docker Build') {
            steps {
                echo '🐳 Building Docker image...'

                sh '''
                docker build -t pettycash-frontend:latest .
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying container...'

                sh '''
                docker stop pettycash-frontend || true
                docker rm pettycash-frontend || true

                docker run -d \
                  --name pettycash-frontend \
                  --restart unless-stopped \
                  -p 3000:3000 \
                  pettycash-frontend:latest
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful'
        }

        failure {
            echo '❌ Pipeline failed'
        }

        always {
            cleanWs()
        }
    }
}
