import { extractDetailsView } from '../../pages/financial/extractDetailsView.js';

export const extractsController = {
    initExtractDetails: async (extractId) => {
        const appRoot = document.getElementById('app-root');
        if (!appRoot) return;
        appRoot.innerHTML = extractDetailsView.render();
        extractDetailsView.init();
        await extractDetailsView.loadExtract(extractId);
    },
};
