# Installation Guide

[Spanish Version (INSTALL_es.md)](INSTALL_es.md) | [French Version (INSTALL_fr.md)](INSTALL_fr.md)

This document outlines the procedures for the deployment and removal of the DisherIo platform.

## System Prerequisites

- Operating System: Linux (Ubuntu 22.04 LTS or higher recommended).
- Version Control: Git.
- Privileges: Sudo/Administrative access.
- Connectivity: Unrestricted outbound internet access.

## Automated Deployment

The integrated installation script automates Docker environment provisioning, configuration initialization, image construction, and database initialization.

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Deployment Sequence:
1. System update and dependency resolution (Docker Engine, Docker Compose).
2. Configuration of the environment variables file (.env).
3. Construction of Docker images for frontend and backend services.
4. Service orchestration via Docker Compose.
5. Database initialization and administrative user provisioning.
6. Reverse proxy configuration (Caddy).

## Manual Development Setup

To establish a local development environment without full automation:

1. Dependency Installation:
   ```bash
   npm install
   ```

2. Database Provisioning:
   Execute a MongoDB instance (version 7.0 or higher):
   ```bash
   docker run -d -p 27017:27017 --name disherio-mongo mongo:7
   ```

3. Environment Configuration:
   Create a `.env` file from `.env.example` and define the required variables.

4. Service Execution:
   ```bash
   # Terminal 1: Backend API
   npm run dev:backend
   
   # Terminal 2: Frontend Application
   npm run dev:frontend
   ```

## System Removal

Procedures for decommissioning the DisherIo instance:

### Standard Decommissioning
Stops services while preserving images and persistent volumes:
```bash
docker compose down
```

### Complete Data Purge
Terminates services and removes all associated assets, including database volumes and images:
```bash
docker compose down -v --rmi all
```

Warning: This operation results in the permanent loss of all database records and uploaded media assets.
