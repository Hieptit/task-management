# Task Management Application

A full-stack task management application with authentication and real-time updates.

## Prerequisites

- Docker
- Docker Compose

## Deployment Instructions

1. Clone the repository:
```bash
git clone <your-github-repo-url>
cd <repo-name>
```

2. Configure environment variables:
   - Update the following values in `docker-compose.yml`:
     - `MYSQL_ROOT_PASSWORD`
     - `DB_PASSWORD`
     - `JWT_SECRET`

3. Build and start the containers:
```bash
docker-compose up -d --build
```

4. The application will be available at:
   - Frontend: http://your-server-ip
   - Backend API: http://your-server-ip:5000

## Architecture

The application consists of three main components:
- Frontend (React)
- Backend (Node.js/Express)
- Database (MySQL)

## Security Notes

1. Make sure to change default passwords in production
2. Configure proper SSL/TLS certificates
3. Update JWT secret to a strong value
4. Consider implementing rate limiting
5. Regular security updates for all containers

## Monitoring

You can monitor the containers using:
```bash
docker-compose ps
docker-compose logs -f
``` 