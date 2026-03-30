# Troubleshooting and Diagnostic Procedures

[Spanish Version (ERRORS_es.md)](ERRORS_es.md) | [French Version (ERRORS_fr.md)](French Version (ERRORS_fr.md)

This document details the resolution procedures for common operational issues and system errors within the DisherIo platform.

## Standardized Error Codes

| Identifier | Functional Context | Recommended Resolution |
|------------|--------------------|------------------------|
| AUTH_001 | Authentication Failure | Verify administrative or user credentials. |
| DB_001 | Persistence Connectivity | Validate database service status and URI parameters. |
| PERM_001 | Authorization Restriction | Review user role assignments and access control policies. |
| VALID_001 | Schema Validation Error | Cross-reference payload data with defined Zod schemas. |

## Documented Issues and Resolutions

### 1. Backend Service Initialization: Missing JWT_SECRET
The application runtime requires the definition of a `JWT_SECRET` within the `.env` configuration file.
Resolution: Generate a cryptographic string of at least 32 characters and update the environment configuration.

### 2. Media Asset Loading Failures
Commonly attributed to filesystem permission restrictions or misconfigured volume mounts.
Resolution: Audit the `uploads/` directory permissions and verify Docker Compose volume definitions.

### 3. Socket.IO Communication Disruption
Often caused by gateway misconfiguration or firewall restrictions.
Resolution: Confirm the Caddy reverse proxy configuration for the `/socket.io/` path and ensure the client-side `withCredentials` property is enabled.

## Diagnostic Logs

Use the following commands to inspect service telemetry:

```bash
# Backend service diagnostics
docker compose logs -f backend

# Reverse proxy (Caddy) diagnostics
docker compose logs -f caddy
```

The comprehensive error registry is available in `docs/ERROR_CODES.md`.
