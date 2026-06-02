import { projectsView } from '../projects/projectsView.js';

/**
 * طبقة العرض — قسم المرافق (نفس واجهة إدارة المشاريع مع التصميم الموحد)
 */
export const facilitiesView = {
    render: () => projectsView.render(),
};
