import { useState, useEffect } from 'react';

const translations = {
    fr: {
        nav: {
            viz: "Visualisation 3D",
            viz2d: "Visualisation 2D",
            softwares: "Logiciels",
            services: "Services",
            settings: "Paramètres",
            structure: "Structure"
        },
        common: {
            add: "Ajouter",
            edit: "Modifier",
            delete: "Supprimer",
            cancel: "Annuler",
            save: "Enregistrer",
            import: "Importer CSV",
            logo: "Logo",
            name: "Nom",
            description: "Description",
            actions: "Actions",
            noImg: "Pas d'image",
            confirmDelete: "Supprimer ?",
            success: "Succès",
            error: "Erreur",
            dataset: "Données",
            criticality: "Criticité",
            tier1: "Tier 1",
            tier2: "Tier 2",
            tier3: "Tier 3",
            none: "Aucune",
            icon: "Icône",
            selectIcon: "Choisir un icône",
            chooseIcon: "Librairie d'icônes",
            search: "Rechercher...",
            noResults: "Aucun résultat"
        },
        services: {
            title: "Gestion des Services",
            create: "Créer",
            color: "Couleur",
            components: "Composants",
            numComponents: "{count} composants",
            viewGrid: "Grille",
            viewGraph: "Graphe",
            viewTree: "Arborescence"
        },
        softwares: {
            title: "Gestion des Logiciels",
            parent: "Parent (Service ou Logiciel)",
            children: "Enfants (Logiciels)",
            access: "Accès",
            none: "Aucun",
            viewGrid: "Liste",
            viewGraph: "Graphe",
            viewTree: "Arborescence"
        },
        viz: {
            refresh: "Rafraîchir",
            csv: "CSV",
            png: "PNG",
            names: "Noms",
            logos: "Logos",
            startSim: "Simuler Panne",
            stopSim: "Arrêter Simulation",
            impacted: "Éléments Impactés",
            reset: "Réinitialiser"
        },
        settings: {
            title: "Paramètres de l'application",
            appName: "Nom de l'application",
            linkOpacity: "Opacité des liens (%)"
        }
    },
    en: {
        nav: {
            viz: "3D Visualization",
            viz2d: "2D Visualization",
            softwares: "Softwares",
            services: "Services",
            settings: "Settings",
            structure: "Structure"
        },
        common: {
            add: "Add",
            edit: "Edit",
            delete: "Delete",
            cancel: "Cancel",
            save: "Save",
            import: "Import CSV",
            logo: "Logo",
            name: "Name",
            description: "Description",
            actions: "Actions",
            noImg: "No image",
            confirmDelete: "Delete?",
            success: "Success",
            error: "Error",
            dataset: "Dataset",
            criticality: "Criticality",
            tier1: "Tier 1",
            tier2: "Tier 2",
            tier3: "Tier 3",
            none: "None",
            icon: "Icon",
            selectIcon: "Select an icon",
            chooseIcon: "Icon Library",
            search: "Search...",
            noResults: "No results"
        },
        services: {
            title: "Service Management",
            create: "Create",
            color: "Color",
            components: "Components",
            numComponents: "{count} components",
            viewGrid: "Grid",
            viewGraph: "Graph",
            viewTree: "Hierarchy"
        },
        softwares: {
            title: "Software Management",
            parent: "Parent (Service or Software)",
            children: "Children (Softwares)",
            access: "Access",
            none: "None",
            viewGrid: "List",
            viewGraph: "Graph",
            viewTree: "Hierarchy"
        },
        viz: {
            refresh: "Refresh",
            csv: "CSV",
            png: "PNG",
            names: "Names",
            logos: "Logos",
            startSim: "Simulate Failure",
            stopSim: "Stop Simulation",
            impacted: "Impacted Elements",
            reset: "Reset"
        },
        settings: {
            title: "Application Settings",
            appName: "Application Name",
            linkOpacity: "Link Opacity (%)"
        }
    }
};

type Language = 'fr' | 'en';

export const useTranslation = () => {
    const [lang, setLang] = useState<Language>((localStorage.getItem('lang') as Language) || 'fr');

    const t = (path: string, params?: Record<string, any>) => {
        const keys = path.split('.');
        let value: any = translations[lang];
        for (const key of keys) {
            value = value?.[key];
        }
        if (typeof value === 'string' && params) {
            Object.keys(params).forEach(p => {
                value = value.replace(`{${p}}`, params[p]);
            });
        }
        return value || path;
    };

    const toggleLang = () => {
        const newLang = lang === 'fr' ? 'en' : 'fr';
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return { t, lang, toggleLang };
};
