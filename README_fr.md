# DisherIo

[English Version (README.md)](README.md) | [Versión en Español (README_es.md)](README_es.md)

DisherIo est une plateforme intégrée de gestion de restaurant offrant des solutions pour la commande en libre-service, l'assistance à table, les systèmes d'affichage en cuisine (KDS) et les opérations de point de vente (POS).

## Index de la Documentation

- [Guide d'Installation](docs/INSTALL_fr.md) : Prérequis système et procédures de déploiement.
- [Configuration et Maintenance](docs/CONFIGURE_fr.md) : Gestion opérationnelle et utilisation des scripts.
- [Architecture et Stack Technique](docs/ARCHITECTURE_fr.md) : Aperçu technique et modèles de conception.
- [Dépannage](docs/ERRORS_fr.md) : Résolution d'erreurs et procédures de diagnostic.

## Modules Principaux

- Borne de Libre-service : Interface client pour la prise de commande via authentification par code QR.
- Système d'Affichage en Cuisine (KDS) : Gestion du cycle de vie des commandes en temps réel pour la cuisine.
- Point de Vente (POS) : Traitement complet des transactions et des paiements.
- Service d'Assistance à Table (TAS) : Outils numériques pour serveurs dédiés à la gestion des tables et aux demandes de service.
- Tableau de Bord Administratif : Analytiques centralisées, administration du personnel et configuration des menus.

## Stack Technique

- Frontend : Angular 21, TailwindCSS, Socket.IO Client.
- Backend : Node.js (Express 5), Socket.IO, Mongoose 9.
- Base de données : MongoDB 7.
- Infrastructure : Docker, Caddy (Proxy Inverse).
- Langage : TypeScript 5.

Pour les spécifications techniques, consultez la [Documentation d'Architecture](docs/ARCHITECTURE_fr.md).

## Déploiement

Déploiement automatisé standard sur Linux :

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Des instructions détaillées sont disponibles dans le [Guide d'Installation](docs/INSTALL_fr.md).

## Cadre de Maintenance

Le répertoire `scripts/` contient les outils d'administration système :

- install.sh : Orchestre le déploiement complet du système.
- configure.sh : Gère les paramètres réseau et les identifiants administratifs.
- backup.sh : Exécute les routines de persistance de la base de données.
- info.sh : Rapporte la télémétrie du système et l'utilisation des ressources.

Consultez le [Guide de Configuration](docs/CONFIGURE_fr.md) pour les détails opérationnels.

## Licence

Propriétaire. Tous droits réservés.
