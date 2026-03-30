# Configuration and Maintenance

[Spanish Version (CONFIGURE_es.md)](CONFIGURE_es.md) | [French Version (CONFIGURE_fr.md)](CONFIGURE_fr.md)

This document provides guidelines for the operational configuration and maintenance of the DisherIo platform using integrated management scripts.

## Administrative Scripts

Management scripts are located in the `scripts/` directory and require administrative privileges.

### 1. System Configuration (configure.sh)
Used for post-installation adjustments to system parameters.
```bash
sudo ./scripts/configure.sh
```
Configurable parameters:
- Domain name and IP address assignment.
- HTTP and HTTPS port configuration.
- Administrative credential reset.
- Environment variable updates.

### 2. Data Persistence (backup.sh)
Executes database backup routines to ensure data integrity.
```bash
sudo ./scripts/backup.sh
```
- Storage Location: Backups are archived in `/var/backups/disherio/`.
- Procedure: Performs a `mongodump` of the production environment.

### 3. System Telemetry (info.sh)
Reports the current operational status and resource utilization.
```bash
sudo ./scripts/info.sh
```
Metrics provided:
- Public and local network addresses.
- Docker container operational status.
- System resource metrics (CPU, Memory, Storage).
- Active environment configuration.

## Environment Configuration

The `.env` file defines the operational parameters of the application.

| Parameter | Functional Description |
|-----------|-------------------------|
| MONGODB_URI | Connection string for database access. |
| JWT_SECRET | Cryptographic secret for session authentication. |
| PORT | Listen port for the Caddy gateway. |
| NODE_ENV | Operational mode (production or development). |

## Software Updates

To deploy the latest version of the platform:
1. Fetch latest changes: `git pull origin main`
2. Reconstruct service images: `docker compose build`
3. Restart orchestrated services: `docker compose up -d`
