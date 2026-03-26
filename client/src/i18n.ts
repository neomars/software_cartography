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
            error: "Erreur"
        },
        softwares: {
            title: "Gestion des Logiciels",
            parent: "Parent (Service ou Logiciel)",
            children: "Enfants (Logiciels)",
            access: "Accès",
            none: "Aucun"
        },
        services: {
            title: "Gestion des Services",
            create: "Créer",
            color: "Couleur",
            components: "Composants",
            numComponents: "{count} composants"
        },
        viz: {
            refresh: "Rafraîchir",
            png: "PNG",
            names: "Noms",
            logos: "Logos"
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
            error: "Error"
        },
        softwares: {
            title: "Software Management",
            parent: "Parent (Service or Software)",
            children: "Children (Softwares)",
            access: "Access",
            none: "None"
        },
        services: {
            title: "Service Management",
            create: "Create",
            color: "Color",
            components: "Components",
            numComponents: "{count} components"
        },
        viz: {
            refresh: "Refresh",
            png: "PNG",
            names: "Names",
            logos: "Logos"
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
