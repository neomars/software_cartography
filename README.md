# Logiciel de Visualisation 3D (Viz3D) / 3D Visualization Software

[Français](#français) | [English](#english)

<a name="français"></a>
## Français

Ce projet est une application de visualisation 3D de l'écosystème logiciel, structuré en services et composants logiciels.

## Architecture

Le projet est un monorepo comprenant :
- **Frontend** : Application React avec `react-force-graph-3d` et Tailwind CSS.
- **Backend** : Serveur Node.js Express.
- **Base de données** : Fichier JSON local (`server/data/db.json`).

## Installation

Pour installer toutes les dépendances du projet (racine, client et serveur) :

```bash
npm run install:all
```

## Démarrage

Pour lancer simultanément le serveur (sur le port 5000) et le client (sur le port 3000) :

```bash
npm start
```

## Utilisation

### Visualisation 3D
La page d'accueil affiche une vue 3D interactive.
- Les **sphères** représentent les services.
- Les **petits nœuds** représentent les logiciels.
- Utilisez la souris pour naviguer, zoomer et cliquer sur les éléments pour les centrer.
- Utilisez les boutons en haut à gauche pour rafraîchir les données, exporter une capture PNG ou basculer entre l'affichage des noms et des logos.

### Gestion des Logiciels
Accédez à l'onglet "Logiciels" pour :
- **Ajouter/Modifier** : Définir le nom, la description, l'accès (booléen) et le service parent.
- **Importer CSV** : Importer des données à partir d'un fichier CSV.
  - Colonnes requises : `Logiciels`, `Accès`, `Description`.
  - Colonne optionnelle : `Service` (Nom du service parent).
  - Le champ `Accès` accepte : `true`, `false`, `oui`, `non`, `1`, `0`.
  - L'importation effectue une déduplication basée sur le nom du logiciel.
- **Logo** : Cliquez sur la zone de logo pour télécharger une image pour chaque logiciel.

### Gestion des Services
Accédez à l'onglet "Services" pour :
- **Créer/Modifier** : Définir le nom, la couleur du service et sélectionner les composants (logiciels ou autres services) qui en font partie.
- **Logo** : Télécharger un logo pour le service.

## Données
Les données sont stockées dans `server/data/db.json`. Les images téléchargées sont sauvegardées dans `server/uploads/`.

---

<a name="english"></a>
## English

This project is a 3D visualization application of the software ecosystem, structured into services and software components.

## Architecture

The project is a monorepo including:
- **Frontend**: React application with `react-force-graph-3d` and Tailwind CSS.
- **Backend**: Node.js Express server.
- **Database**: Local JSON file (`server/data/db.json`).

## Installation

To install all project dependencies (root, client, and server):

```bash
npm run install:all
```

## Getting Started

To simultaneously launch the server (on port 5000) and the client (on port 3000):

```bash
npm start
```

## Usage

### 3D Visualization
The home page displays an interactive 3D view.
- **Spheres** represent services.
- **Small nodes** represent softwares.
- Use the mouse to navigate, zoom, and click on elements to center them.
- Use the buttons in the top left to refresh data, export a PNG capture, or toggle between displaying names and logos.

### Software Management
Go to the "Softwares" tab to:
- **Add/Edit**: Define name, description, access (boolean), parent service, and child softwares.
- **Import CSV**: Import data from a CSV file.
  - Required columns: `Logiciels`, `Accès`, `Description`.
  - Optional column: `Service` (Name of the parent service).
  - The `Accès` field accepts: `true`, `false`, `oui`, `non`, `1`, `0`.
  - Import performs deduplication based on software name.
- **Logo**: Click on the logo area to upload an image for each software.

### Service Management
Go to the "Services" tab to:
- **Create/Edit**: Define name, service color, and select components (softwares or other services) that are part of it.
- **Logo**: Upload a logo for the service.

## Data
Data is stored in `server/data/db.json`. Uploaded images are saved in `server/uploads/`.
