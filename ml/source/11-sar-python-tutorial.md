# Synthetic Aperture Radar Python Tutorial (ASC-CSA)

- **Source URL:** https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial
- **Priority for OrangHave / H.O.M.E.:** Pendukung
- **Relevance:** Tutorial Python/QGIS pengolahan SAR + contoh **wildfire** (RCM BC fires) — paralel dengan pipeline ML/FIRMS/SAR di `ml/`.

## README (ekstrak repositori)

<p align="center">
    <img src="https://www.asc-csa.gc.ca/images/recherche/tiles/50d50dc4-45c1-4933-8a41-b312472b3bb3.jpg" height="300">
    <br> Crédit d'image | Image credit: <a href="https://www.asc-csa.gc.ca/images/recherche/tiles/50d50dc4-45c1-4933-8a41-b312472b3bb3.jpg">ASC-CSA</a>
</p>

<p align="center">
    <a href="#stars">
        <img alt="Étoiles sur GitHub | GitHub Repo stars" src="https://img.shields.io/github/stars/asc-csa/Synthetic_Aperture_Radar_Tutorial">
    </a>
    <a href="#watchers">
        <img alt="Spectateurs sur Github | GitHub watchers" src="https://img.shields.io/github/watchers/asc-csa/Synthetic_Aperture_Radar_Tutorial">
    </a>
    <a href="https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/commits/main">
        <img alt="Dernier commit sur GitHub | GitHub last commit" src="https://img.shields.io/github/last-commit/asc-csa/Synthetic_Aperture_Radar_Tutorial">
    </a>
    <a href="https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/graphs/contributors">
        <img alt="Contributeurs sur GitHub | GitHub contributors" src="https://img.shields.io/github/contributors/asc-csa/Synthetic_Aperture_Radar_Tutorial">
    </a>
    <a href="https://twitter.com/intent/follow?screen_name=csa_asc">
        <img alt="Suivre sur Twitter | Twitter Follow" src="https://img.shields.io/twitter/follow/csa_asc?style=social">
    </a>
</p>

---

<h3 align="center">
  <a href="#titre-du-projet">Français</a> |
  <a href="#project-title">English (follows)</a>
</h3>

---

<a id="titre-du-projet"></a>
# Radar à synthèse d'ouverture (RSO) - Un tutoriel

> **Description brève :**
> Guide pour débutants sur le traçage de fichiers raster et de fichiers de formes des missions RADARSAT en Python et QGIS.

## À propos

**Radar à synthèse d'ouverture (RSO) - Un tutoriel** est un guide pour débutants qui aide les utilisateurs à utiliser les données de mission RADARSAT pour le traçage de fichiers raster et de fichiers de formes en Python et QGIS. Il couvre :

- Utilisation de QGIS pour charger et visualiser des fichiers raster et vectoriels
- Traitement de données SAR avec Python via osgeo et cartopy
- Visualisation de données de feux de forêt de la Colombie-Britannique prises par RCM3
- Manipulation de fichiers de formes géographiques et de données raster

Le tutoriel s'adresse aux débutants et offre un guide étape par étape pour guider les utilisateurs avec le traçage des fichiers raster et des fichiers de formes des missions RADARSAT en Python et QGIS. Sur cette page se trouvent les deux dossiers suivants :

*Option 1 - QGIS*:
  1) Un fichier PDF avec un guide étape par étape sur l’utilisation de QGIS et le téléchargement d’un fichier raster et d’un fichier vectoriel.
  2) Un exemple de fichier raster tracé dans QGIS à partir de feux de forêt en Colombie-Britannique pris par RCM3 - OK2080033 (le lien se trouve ci-dessous).

*Option 2 - Python*:
  1) Le carnet de notes Jupyter avec des exemples de traçage de fichiers raster via osgeo et cartopy.

**Note :**

Le fichier raster est basé sur les données RCM tirées du lien suivant : https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/BC%20fires/

Le fichier de formes est tiré du lien suivant : http://www.naturalearthdata.com/features/

*Ce tutoriel est fourni à des fins pédagogiques et expérimentales.*

## Prérequis

- Python 3.8 ou plus récent
- Jupyter Notebook ou Jupyter Lab
- QGIS (pour l'Option 1)
- Bibliothèques Python : osgeo (GDAL), cartopy, matplotlib
- Connexion Internet (pour le téléchargement des données)

## Démarrage rapide

1. 📦 **Cloner le dépôt**
   ```bash
   git clone https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial.git
   cd Synthetic_Aperture_Radar_Tutorial
   ```
2. 🐍 **Créer un environnement**
   ```bash
   # Avec virtualenv
   python -m venv env
   source env/bin/activate

   # Ou avec conda
   conda create -n sar_env python=3.8
   conda activate sar_env
   ```
3. 📥 **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```
4. 🚀 **Lancer le tutoriel**
   ```bash
   # Option 1 - QGIS : suivre le guide PDF
   # Option 2 - Python :
   jupyter notebook
   ```

> **Remarque :** Deux options sont disponibles - QGIS pour une approche GUI ou Python/Jupyter pour une approche programmatique.

## Astuces & Conseils

- **QGIS :** Téléchargez la version LTS pour une meilleure stabilité
- **GDAL :** Assurez-vous que GDAL est correctement installé pour la manipulation des rasters
- **Données :** Les fichiers exemple sont basés sur des données RCM réelles de feux de forêt en C.-B.
- **Performance :** Les fichiers raster peuvent être volumineux, assurez-vous d'avoir suffisamment d'espace de stockage

## Licence

Ce projet est sous une licence MIT modifiée – voir le fichier [LICENSE](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/LICENSE.txt) pour plus de détails.

---

<h3 align="center">
  <a href="#project-title">English </a> |
  <a href="#titre-du-projet">Français (précède)</a>
</h3>

---

<a id="project-title"></a>
# Synthetic Aperture Radar (SAR) - A tutorial

> **Brief description:**
> Beginner's guide to plotting RADARSAT mission raster and shapefiles in Python and QGIS.

## About

**Synthetic Aperture Radar (SAR) - A tutorial** is a beginner's guide that helps users work with RADARSAT mission data for plotting raster files and shapefiles in Python and QGIS. It covers:

- Using QGIS to load and visualize raster and vector files
- Processing SAR data with Python via osgeo and cartopy
- Visualizing British Columbia wildfire data taken by RCM3
- Manipulating geographic shapefiles and raster data

The tutorial is geared towards beginners and offers a step by step guide to direct users with plotting the raster files and shapefiles of RADARSAT missions in Python and QGIS. On this page the following two folders can be found:

*Option 1 - QGIS*:
  1) A file with a step by step guide on using QGIS and uploading a raster and a vector file.
  2) An example of a plotted raster file in QGIS from British Columbia wildfires taken by RCM3 - OK2080033 (The link can be found below).

*Option 2 - Python*:
  1) The Jupyter notebook with examples of plotting raster files via osgeo and cartopy.

**Note:**

The raster file is based on the RCM data from the following link: https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/BC%20fires/

The shapefile is taken from the following link: http://www.naturalearthdata.com/features/

*This tutorial is provided for educational and experimental purposes.*

## Prerequisites

- Python 3.8 or newer
- Jupyter Notebook or Jupyter Lab
- QGIS (for Option 1)
- Python libraries: osgeo (GDAL), cartopy, matplotlib
- Internet connection (for data download)

## Quick Start

1. 📦 **Clone the repo**
   ```bash
   git clone https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial.git
   cd Synthetic_Aperture_Radar_Tutorial
   ```
2. 🐍 **Create environment**
   ```bash
   # Using virtualenv
   python -m venv env
   source env/bin/activate

   # Or using conda
   conda create -n sar_env python=3.8
   conda activate sar_env
   ```
3. 📥 **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. 🚀 **Run the tutorial**
   ```bash
   # Option 1 - QGIS: follow the PDF guide
   # Option 2 - Python:
   jupyter notebook
   ```

> **Note:** Two options are available - QGIS for a GUI approach or Python/Jupyter for a programmatic approach.

## Tips & Tricks

- **QGIS:** Download the LTS version for better stability
- **GDAL:** Ensure GDAL is properly installed for raster manipulation
- **Data:** Example files are based on real RCM data from B.C. wildfires
- **Performance:** Raster files can be large, ensure sufficient storage space

## License

This project is licensed under a modified MIT license - see the [LICENSE](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial/blob/main/LICENSE.txt) file for details.


## Catatan untuk project

- Contoh data kebakaran hutan RCM: https://donnees-data.asc-csa.gc.ca/users/OpenData_DonneesOuvertes/pub/BC%20fires/
- Stack teknis: GDAL/osgeo, cartopy, matplotlib, Jupyter, QGIS.
- Bisa dipakai sebagai referensi pola visualisasi raster SAR sebelum/atau bersamaan dengan ekspansi `ml/pipeline.py`.
