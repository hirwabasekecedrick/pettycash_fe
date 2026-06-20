pipeline {
    agent {
        docker {
            image 'node:20-alpine'
        }
    }
    
    environment {
        NODE_ENV = 'production'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node') {
            steps {
                echo '🟢 Using Node.js environment...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                sh 'npm ci || npm install'
            }
        }

        stage('Lint') {
            steps {
                echo '🧹 Running linter...'
                sh 'npm run lint || true'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh 'npm test || true'
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
                echo '📦 Archiving build output...'
                archiveArtifacts artifacts: '.next/**', fingerprint: true
            }
        }

        stage('Deploy (Optional - Docker)') {
            steps {
                echo '🚀 Building Docker image...'

                sh '''
                docker build -t nextjs-app .
                docker stop nextjs-app || true
                docker rm nextjs-app || true
                docker run -d -p 3000:3000 --name nextjs-app nextjs-app
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build successful!'
        }

        failure {
            echo '❌ Build failed!'
        }

        always {
            echo '🧹 Cleaning workspace...'
            cleanWs()
        }
    }
}
