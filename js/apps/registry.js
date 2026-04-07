// js/apps/registry.js
export const registry = {
    solitaire: async () => {
        const module = await import('./solitaire.js');
        return module.createApp;
    },
    paint: async () => {
        const module = await import('./paint.js');
        return module.createApp;
    },
    calculator: async () => {
        const module = await import('./calculator.js');
        return module.createApp;
    },
    solmerica: async () => {
        const module = await import('./solmerica.js');
        return module.createApp;
    }
};
