import { projectsView } from '../projects/projectsView.js';

export const facilitiesController = {
    init: async () => {
        await projectsView.init();
    },
};
