1. Build and start all services (without mobile app)
`docker compose -f docker-compose-local.yml up --build -d`

2. Start existing images (no rebuild)
`docker compose -f docker-compose-local.yml up -d`
