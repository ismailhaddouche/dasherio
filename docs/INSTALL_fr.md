# Guide d'Installation

[English Version (INSTALL.md)](INSTALL.md) | [Versión en Español (INSTALL_es.md)](INSTALL_es.md)

Ce document décrit les procédures de déploiement et de suppression de la plateforme DisherIo.

## Prérequis Système

- Système d'Exploitation : Linux (Ubuntu 22.04 LTS ou supérieur recommandé).
- Contrôle de Version : Git.
- Privilèges : Accès Sudo/Administratif.
- Connectivité : Accès Internet sortant sans restriction.

## Déploiement Automatisé

Le script d'installation intégré automatise le provisionnement de l'environnement Docker, l'initialisation de la configuration, la construction des images et l'initialisation de la base de données.

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Séquence de Déploiement :
1. Mise à jour du système et résolution des dépendances (Docker Engine, Docker Compose).
2. Configuration du fichier de variables d'environnement (.env).
3. Construction des images Docker pour les services frontend et backend.
4. Orchestration des services via Docker Compose.
5. Initialisation de la base de données et provisionnement de l'utilisateur administrateur.
6. Configuration du proxy inverse (Caddy).

## Configuration Manuelle pour le Développement

Pour établir un environnement de développement local sans automatisation complète :

1. Installation des Dépendances :
   ```bash
   npm install
   ```

2. Provisionnement de la Base de Données :
   Exécutez une instance MongoDB (version 7.0 ou supérieure) :
   ```bash
   docker run -d -p 27017:27017 --name disherio-mongo mongo:7
   ```

3. Configuration de l'Environnement :
   Créez un fichier `.env` à partir de `.env.example` et définissez les variables requises.

4. Exécution des Services :
   ```bash
   # Terminal 1 : API Backend
   npm run dev:backend
   
   # Terminal 2 : Application Frontend
   npm run dev:frontend
   ```

## Suppression du Système

Procédures de démantèlement de l'instance DisherIo :

### Démantèlement Standard
Arrête les services tout en préservant les images et les volumes persistants :
```bash
docker compose down
```

### Purge Complète des Données
Termine les services et supprime tous les actifs associés, y compris les volumes de base de données et les images :
```bash
docker compose down -v --rmi all
```

Avertissement : Cette opération entraîne la perte permanente de tous les enregistrements de la base de données et des fichiers multimédias téléchargés.
