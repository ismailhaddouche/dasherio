# Configuration et Maintenance

[English Version (CONFIGURE.md)](CONFIGURE.md) | [Versión en Español (CONFIGURE_es.md)](CONFIGURE_es.md)

Ce document fournit les directives pour la configuration opérationnelle et la maintenance de la plateforme DisherIo à l'aide des scripts de gestion intégrés.

## Scripts Administratifs

Les scripts de gestion sont situés dans le répertoire `scripts/` et nécessitent des privilèges administratifs.

### 1. Configuration Système (configure.sh)
Utilisé pour les ajustements post-installation des paramètres système.
```bash
sudo ./scripts/configure.sh
```
Paramètres configurables :
- Assignation du nom de domaine et de l'adresse IP.
- Configuration des ports HTTP et HTTPS.
- Réinitialisation des identifiants administratifs.
- Mise à jour des variables d'environnement.

### 2. Persistance des Données (backup.sh)
Exécute les routines de sauvegarde de la base de données pour assurer l'intégrité des informations.
```bash
sudo ./scripts/backup.sh
```
- Emplacement de Stockage : Les sauvegardes sont archivées dans `/var/backups/disherio/`.
- Procédure : Effectue un `mongodump` de l'environnement de production.

### 3. Télémétrie Système (info.sh)
Rapporte l'état opérationnel actuel et l'utilisation des ressources.
```bash
sudo ./scripts/info.sh
```
Métriques fournies :
- Adresses réseau publiques et locales.
- État opérationnel des conteneurs Docker.
- Métriques des ressources système (CPU, Mémoire, Stockage).
- Configuration active de l'environnement.

## Configuration de l'Environnement

Le fichier `.env` définit les paramètres opérationnels de l'application.

| Paramètre | Description Fonctionnelle |
|-----------|---------------------------|
| MONGODB_URI | Chaîne de connexion pour l'accès à la base de données. |
| JWT_SECRET | Secret cryptographique pour l'authentification des sessions. |
| PORT | Port d'écoute pour la passerelle Caddy. |
| NODE_ENV | Mode opérationnel (production ou development). |

## Mises à jour Logicielles

Pour déployer la dernière version de la plateforme :
1. Récupérer les derniers changements : `git pull origin main`
2. Reconstruire les images des services : `docker compose build`
3. Redémarrer les services orchestrés : `docker compose up -d`
