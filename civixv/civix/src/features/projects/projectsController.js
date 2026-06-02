import { projectDetailsView } from '../../pages/financial/projectDetailsView.js';
import { financialView } from '../../pages/financial/financialView.js';
import { projectsService } from '../projects/projectsService.js';
import { extractsController } from '../extracts/extractsController.js';

export const projectsController = {
  init: async () => {
    window.addEventListener('hashchange', projectsController.route);
    await projectsController.route(); // عند الدخول مباشرة
  },

  route: async () => {
    const hash = window.location.hash;
    const projectId = hash.match(/#\/projects\/(\d+)/)?.[1];
    const extractId = hash.match(/#\/extracts\/(\d+)/)?.[1];

    if (extractId) {
      await extractsController.initExtractDetails(extractId);
      return;
    }

    if (projectId) {
      // عرض صفحة التفاصيل
      document.querySelector('main').innerHTML = projectDetailsView.render();
      projectDetailsView.init();
      projectDetailsView.loadProject(projectId);
    } else {
      // عرض صفحة المالية بالمستخلص
      document.querySelector('main').innerHTML = financialView.render();
      financialView.showLoading();
      try {
        const projects = await projectsService.getAllProjects();
        financialView.renderProjects(projects);
      } catch (err) {
        financialView.showError(err.message);
      }
    }
  }
};