#!/bin/bash

# Docker helper scripts for remal-api-1

case "$1" in
  "dev")
    echo "Starting development environment..."
    docker compose --profile dev up --build
    ;;
  "dev-detached")
    echo "Starting development environment in detached mode..."
    docker compose --profile dev up -d --build
    ;;
  "prod")
    echo "Starting production environment..."
    docker compose --profile prod up --build
    ;;
  "prod-detached")
    echo "Starting production environment in detached mode..."
    docker compose --profile prod up -d --build
    ;;
  "stop")
    echo "Stopping all services..."
    docker compose down
    ;;
  "clean")
    echo "Stopping and removing all containers, networks, and volumes..."
    docker compose down -v --remove-orphans
    docker system prune -f
    ;;
  "logs")
    if [ -n "$2" ]; then
      docker compose logs -f "$2"
    else
      docker compose logs -f
    fi
    ;;
  "shell")
    if [ "$2" = "app" ]; then
      docker compose exec app-dev sh
    elif [ "$2" = "db" ]; then
      docker compose exec postgres psql -U remal_user -d remal_db
    else
      echo "Available shells: app, db"
    fi
    ;;
  "migrate")
    echo "Running database migrations..."
    docker compose exec app-dev npm run prisma:migrate
    ;;
  "seed")
    echo "Seeding database..."
    docker compose exec app-dev npm run prisma:seed
    ;;
  "studio")
    echo "Opening Prisma Studio..."
    docker compose exec app-dev npm run prisma:studio
    ;;
  *)
    echo "Usage: $0 {dev|dev-detached|prod|prod-detached|stop|clean|logs [service]|shell [app|db]|migrate|seed|studio}"
    echo ""
    echo "Commands:"
    echo "  dev              Start development environment with hot reload"
    echo "  dev-detached     Start development environment in background"
    echo "  prod             Start production environment"
    echo "  prod-detached    Start production environment in background"
    echo "  stop             Stop all running containers"
    echo "  clean            Remove all containers, networks, and volumes"
    echo "  logs [service]   View logs (optionally for specific service)"
    echo "  shell app        Access shell in app container"
    echo "  shell db         Access PostgreSQL shell"
    echo "  migrate          Run database migrations"
    echo "  seed             Seed the database"
    echo "  studio           Open Prisma Studio"
    exit 1
    ;;
esac
