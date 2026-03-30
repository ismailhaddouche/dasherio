# DisherIo

[Spanish Version (README_es.md)](README_es.md) | [French Version (README_fr.md)](README_fr.md)

DisherIo is an integrated restaurant management platform providing solutions for self-service ordering, table assistance, kitchen display systems (KDS), and point-of-sale (POS) operations.

## Documentation Index

- [Installation Guide](docs/INSTALL.md): System requirements and deployment procedures.
- [Configuration and Maintenance](docs/CONFIGURE.md): Operational management and script usage.
- [Architecture and Technology Stack](docs/ARCHITECTURE.md): Technical overview and design patterns.
- [Troubleshooting](docs/ERRORS.md): Error resolution and diagnostic procedures.

## Core Modules

- Self-Service Totem: Customer interface for order placement via QR code authentication.
- Kitchen Display System (KDS): Real-time order lifecycle management for kitchen operations.
- Point of Sale (POS): Comprehensive transaction and payment processing.
- Table Assistance Service (TAS): Digital waiter tools for table management and service requests.
- Administrative Dashboard: Centralized analytics, staff administration, and menu configuration.

## Technology Stack

- Frontend: Angular 21, TailwindCSS, Socket.IO Client.
- Backend: Node.js (Express 5), Socket.IO, Mongoose 9.
- Database: MongoDB 7.
- Infrastructure: Docker, Caddy (Reverse Proxy).
- Language: TypeScript 5.

For technical specifications, refer to the [Architecture Documentation](docs/ARCHITECTURE.md).

## Deployment

Standard automated deployment on Linux:

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Detailed instructions are available in the [Installation Guide](docs/INSTALL.md).

## Maintenance Framework

The `scripts/` directory contains tools for system administration:

- install.sh: Orchestrates full system deployment.
- configure.sh: Manages network parameters and administrative credentials.
- backup.sh: Executes database persistence routines.
- info.sh: Reports system telemetry and resource utilization.

Refer to the [Configuration Guide](docs/CONFIGURE.md) for operational details.

## License

Proprietary. All rights reserved.
