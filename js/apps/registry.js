// js/apps/registry.js
export const registry = {
    solitaire: async () => {
        try {
            const module = await import('./solitaire/index.js');
            return module.createApp;
        } catch {
            const module = await import('./solitaire.js');
            return module.createApp;
        }
    },
    paint: async () => {
        try {
            const module = await import('./paint/index.js');
            return module.createApp;
        } catch {
            const module = await import('./paint.js');
            return module.createApp;
        }
    },
    calculator: async () => {
        try {
            const module = await import('./calculator/index.js');
            return module.createApp;
        } catch {
            const module = await import('./calculator.js');
            return module.createApp;
        }
    },
    solmerica: async () => {
        try {
            const module = await import('./solmerica/index.js');
            return module.createApp;
        } catch {
            const module = await import('./solmerica.js');
            return module.createApp;
        }
    },
    notepad: async () => {
        const module = await import('./notepad/index.js');
        return module.createApp;
    }
};
