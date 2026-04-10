# Viz3D - Cartographie Logicielle 2D & 3D / 2D & 3D Software Cartography

[Français](#français) | [English](#english)

<a name="français"></a>
## Français

Ce projet est une plateforme interactive de visualisation et de simulation de l'écosystème logiciel, structuré en services et composants logiciels.

## Architecture

Le projet est un monorepo comprenant :
- **Frontend** : Application React avec `react-force-graph-3d`, `react-force-graph-2d` et Tailwind CSS.
- **Backend** : Serveur Node.js Express.
- **Base de données** : Plusieurs jeux de données JSON stockés dans `server/data/datasets/`.
- **Paramètres globaux** : `server/data/settings.json`.

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

## Fonctionnalités Principales

### Visualisation et Simulation (2D & 3D)
- **Vues Dynamiques** : Basculez entre une vue 3D immersive et une vue 2D fluide.
- **Analyse de Lignage** : Cliquez sur un nœud pour mettre en évidence ses ancêtres et ses descendants via des effets de lueur et des flux de particules.
- **Simulation de Panne** : Mode "Simuler Panne" pour analyser les impacts en cascade. Les nœuds en échec sont rouges, les éléments impactés sont oranges.
- **Export** : Exportez vos analyses au format CSV ou capturez la vue au format PNG.

### Gestion Multi-Jeux de Données (Datasets)
- Gérez plusieurs environnements ou projets séparément.
- Importez des fichiers CSV dans le jeu de données actif.
- Basculez entre les jeux de données instantanément via l'interface des Paramètres.

### Administration Avancée
- **Relations Multi-Parents** : Un logiciel ou un service peut désormais dépendre de plusieurs parents.
- **Index de Criticité** : Classification Tier 1 (Rouge), Tier 2 (Orange), Tier 3 (Vert) avec héritage automatique des services vers les logiciels.
- **Bibliothèque d'Icônes** : Intégration complète de la bibliothèque Tabler Icons pour une identification visuelle rapide.
- **Vues Flexibles** : Listes tabulaires, grilles de cartes, graphes de force ou arborescences hiérarchiques.

## Données et Médias
- **Datasets** : `server/data/datasets/*.json`
- **Médias** : Les logos téléchargés sont sauvegardés dans `server/uploads/`.
- **Captures de Vérification** : Disponibles dans `client/media/`.

---

<a name="english"></a>
## English

This project is an interactive platform for visualization and simulation of the software ecosystem, structured into services and software components.

## Architecture

The project is a monorepo including:
- **Frontend**: React application with `react-force-graph-3d`, `react-force-graph-2d`, and Tailwind CSS.
- **Backend**: Node.js Express server.
- **Database**: Multiple JSON datasets stored in `server/data/datasets/`.
- **Global Settings**: `server/data/settings.json`.

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

## Main Features

### Visualization and Simulation (2D & 3D)
- **Dynamic Views**: Toggle between an immersive 3D view and a fluid 2D view.
- **Lineage Analysis**: Click a node to highlight its ancestors and descendants using glow effects and particle flows.
- **Failure Simulation**: "Simulate Failure" mode to analyze cascading impacts. Failed nodes are red, impacted elements are orange.
- **Export**: Export your analyses in CSV format or capture the view in PNG format.

### Multi-Dataset Management
- Manage multiple environments or projects separately.
- Import CSV files into the active dataset.
- Switch between datasets instantly via the Settings interface.

### Advanced Administration
- **Multi-Parent Relationships**: A software or service can now depend on multiple parents.
- **Criticality Index**: Tier 1 (Red), Tier 2 (Orange), Tier 3 (Green) classification with automatic inheritance from services to software.
- **Icon Library**: Full integration of the Tabler Icons library for quick visual identification.
- **Flexible Views**: Tabular lists, card grids, force graphs, or hierarchical trees.

## Data and Media
- **Datasets**: `server/data/datasets/*.json`
- **Media**: Uploaded logos are saved in `server/uploads/`.
- **Verification Captures**: Available in `client/media/`.
