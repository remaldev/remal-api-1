# Docker Setup for Remal API

This project is fully dockerized with support for both development and production environments.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Development Environment (with hot reload)

```bash
# Start development environment
./docker.sh dev

# Or start in detached mode (background)
./docker.sh dev-detached
```

This will:

- Start PostgreSQL database
- Start NestJS app with hot reload enabled
- Mount your source code for live changes
- App accessible at http://localhost:3000

### Production Environment

```bash
# Start production environment
./docker.sh prod

# Or start in detached mode
./docker.sh prod-detached
```

## Available Commands

```bash
./docker.sh dev              # Start development with hot reload
./docker.sh dev-detached     # Start development in background
./docker.sh prod             # Start production environment
./docker.sh prod-detached    # Start production in background
./docker.sh stop             # Stop all containers
./docker.sh clean            # Remove containers, networks, volumes
./docker.sh logs [service]   # View logs
./docker.sh shell app        # Access app container shell
./docker.sh shell db         # Access PostgreSQL shell
./docker.sh migrate          # Run database migrations
./docker.sh seed             # Seed the database
./docker.sh studio           # Open Prisma Studio
```

## Manual Docker Commands

If you prefer using docker-compose directly:

```bash
# Development
docker-compose --profile dev up --build

# Production
docker-compose --profile prod up --build

# Stop everything
docker-compose down
```

## Database Access

- **Host**: localhost
- **Port**: 5432
- **Database**: remal_db
- **Username**: remal_user
- **Password**: remal_password

### Connect to PostgreSQL shell:

```bash
./docker.sh shell db
```

## Environment Variables

The Docker setup uses the following database URL:

```
DB_POSTGRE_URI=postgresql://remal_user:remal_password@postgres:5432/remal_db
```

## Hot Reloading

In development mode, your local source code is mounted into the container, so any changes you make will trigger a restart of the NestJS application automatically.

## Troubleshooting

### Clean slate restart:

```bash
./docker.sh clean
./docker.sh dev
```

### View logs:

```bash
./docker.sh logs          # All services
./docker.sh logs app-dev  # Just the app
./docker.sh logs postgres # Just the database
```

### Database issues:

1. Ensure PostgreSQL is healthy: `docker-compose ps`
2. Check database logs: `./docker.sh logs postgres`
3. Reset everything: `./docker.sh clean` then start again

## File Structure

- `Dockerfile` - Multi-stage Docker build
- `docker-compose.yml` - Development and production services
- `.dockerignore` - Files to exclude from Docker context
- `docker.sh` - Helper script for common operations
- `.env.docker` - Docker-specific environment variables
