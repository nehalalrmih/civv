import { headerView } from '../headerView.js';

export const engineersView = {

    render: () => `

        ${headerView.render()}

        <div class="page">

            <aside class="projects-sidebar">

                <button id="navProjects">المشاريع</button>
                <button id="navCompanies">الشركات</button>
                <button id="navEngineers">المهندسين</button>

            </aside>

            <div class="content">

                <h2>المهندسين</h2>

                <div id="engineersContainer"></div>

            </div>

        </div>
    `,

    init: () => {

        document.getElementById('navProjects')
            ?.addEventListener('click', () =>
                window.location.hash = '#/projects'
            );

        document.getElementById('navCompanies')
            ?.addEventListener('click', () =>
                window.location.hash = '#/companies'
            );

        document.getElementById('navEngineers')
            ?.addEventListener('click', () =>
                window.location.hash = '#/engineers'
            );
    }
};