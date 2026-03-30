# Procédures de Diagnostic et de Dépannage

[English Version (ERRORS.md)](ERRORS.md) | [Versión en Español (ERRORS_es.md)](ERRORS_es.md)

Ce document détaille les procédures de résolution des problèmes opérationnels courants et des erreurs système au sein de la plateforme DisherIo.

## Codes d'Erreur Standardisés

| Identifiant | Contexte Fonctionnel | Résolution Recommandée |
|-------------|----------------------|------------------------|
| AUTH_001 | Échec d'Authentification | Vérifier les identifiants administratifs ou utilisateur. |
| DB_001 | Connectivité de Persistance | Valider l'état du service de base de données et les paramètres URI. |
| PERM_001 | Restriction d'Autorisation | Réviser les attributions de rôles utilisateur et les politiques de contrôle d'accès. |
| VALID_001 | Erreur de Validation de Schéma | Comparer les données transmises avec les schémas Zod définis. |

## Problèmes Documentés et Résolutions

### 1. Initialisation du Service Backend : JWT_SECRET Manquant
L'exécution de l'application nécessite la définition d'un `JWT_SECRET` dans le fichier de configuration `.env`.
Résolution : Générer une chaîne cryptographique d'au moins 32 caractères et mettre à jour la configuration de l'environnement.

### 2. Échecs de Chargement des Actifs Multimédias
Généralement attribué à des restrictions de permissions du système de fichiers ou à des montages de volumes mal configurés.
Résolution : Auditer les permissions du répertoire `uploads/` et vérifier les définitions de volumes dans Docker Compose.

### 3. Interruption de la Communication Socket.IO
Souvent causé par une mauvaise configuration de la passerelle ou des restrictions de pare-feu.
Résolution : Confirmer la configuration du proxy inverse Caddy pour le chemin `/socket.io/` et s'assurer que la propriété `withCredentials` est activée côté client.

## Logs de Diagnostic

Utilisez les commandes suivantes pour inspecter la télémétrie des services :

```bash
# Diagnostic du service backend
docker compose logs -f backend

# Diagnostic du proxy inverse (Caddy)
docker compose logs -f caddy
```

Le registre complet des erreurs est disponible dans `docs/ERROR_CODES.md`.
