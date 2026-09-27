pipeline {
    agent any

    environment {
        IMAGE_NAME = "price-tracker-backend"
        CONTAINER_NAME = "price-tracker"
        ENV_FILE = "/home/ubuntu/pricetracker/backend/.env"
        HOST_PORT = "3000"
        CONTAINER_PORT = "3000"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out latest code...'
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image...'

                sh '''
                    docker build \
                      -t ${IMAGE_NAME}:latest \
                      ./backend
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                echo 'Stopping old container...'

                sh '''
                    docker rm -f ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                echo 'Starting new container...'

                sh '''
                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      --env-file ${ENV_FILE} \
                      -p ${HOST_PORT}:${CONTAINER_PORT} \
                      --restart unless-stopped \
                      ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Checking container...'

                sh '''
                    sleep 5

                    if [ "$(docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME})" != "true" ]; then
                        echo "Container failed to start"
                        docker logs ${CONTAINER_NAME}
                        exit 1
                    fi

                    echo "Container is running successfully"
                    docker ps --filter name=${CONTAINER_NAME}
                '''
            }
        }
    }

    post {
        success {
            echo '================================='
            echo 'DEPLOYMENT SUCCESSFUL'
            echo '================================='
        }

        failure {
            echo '================================='
            echo 'DEPLOYMENT FAILED'
            echo '================================='
            sh 'docker logs ${CONTAINER_NAME} || true'
        }
    }
}