# Architecture et Stack Technique

[English Version (ARCHITECTURE.md)](ARCHITECTURE.md) | [Versión en Español (ARCHITECTURE_es.md)](ARCHITECTURE_es.md)

Ce document fournit un aperçu technique de l'architecture de la plateforme DisherIo et de son stack technique sous-jacent.

## Architecture Système

La plateforme utilise une architecture monorepo organisée en trois modules principaux :
- backend : API Node.js Express facilitant la logique métier et la persistance des données.
- frontend : Application Angular SPA fournissant l'interface utilisateur pour les différents modules.
- shared : Bibliothèque commune contenant les types, schémas et définitions d'erreurs unifiés.

### Orchestration du Flux de Données
```
                    Caddy (Proxy Inverse)
                       Ports 80 / 443
                    /                  \
           Frontend                  Backend
           Angular 21                Express 5
           Port 4200                 Port 3000
                                         |
                                      MongoDB
                                      Port 27017
```

## Stack Technique

### Services Backend
- Framework : Express 5.2
- Langage d'Exécution : TypeScript 5.4
- Couche de Base de Données : MongoDB 7 + Mongoose 9
- Cadre de Sécurité : JWT + CASL (Contrôle d'Accès Basé sur les Attributs)
- Validation de Schéma : Zod
- Communication en Temps Réel : Socket.IO 4.8
- Cadre de Journalisation (Logging) : Pino

### Application Frontend
- Framework : Angular 21.2
- Cadre de Styles : TailwindCSS 3.4
- Intégration en Temps Réel : Socket.IO Client
- Gestion d'État Réactive : Angular Signals et stores dédiés

### Infrastructure et Déploiement
- Conteneurisation : Docker & Docker Compose
- Services de Passerelle : Caddy 2
- Traitement Multimédia : Sharp

## Modèles de Conception Architecturale

### Patron Repositorio (Backend)
Le backend implémente le Patron Repositorio pour découpler la logique métier de la couche d'accès aux données. Les services interagissent exclusivement avec les Repositories, qui gèrent les interactions avec les modèles Mongoose, améliorant ainsi la testabilité et la maintenance du système.

### Registres de Décisions Architecturales (ADRs)
La documentation formelle des décisions architecturales est disponible dans `docs/architecture/` :
- ADR-001 : Organisation structurelle de la hiérarchie des répertoires.
- ADR-002 : Implémentation du Patron Repositorio.
- ADR-003 : Stratégies de gestion d'état.
- ADR-004 : Définitions unifiées des types et de la validation.
