// Show projects list

import { projects } from './projects.js';
import { openModal } from './modal.js';

const projectContainer = document.querySelector('.projects');

export const renderProjects = (projectsData = projects) => {
  projectContainer.innerHTML = '<h2 class="semi_title">Projects</h2>';

  if (projectsData && Object.keys(projectsData).length > 0) {
    for (const key in projectsData) {
      const project = projectsData[key];
      const projectElement = createProjectElement(project);
      projectContainer.appendChild(projectElement);
    }
  } else {
    displayNoProjectsMessage();
  }
};

const createProjectElement = (project) => {
  const projectElement = document.createElement('div');
  projectElement.classList.add('project');

  projectElement.innerHTML = `
    <img src="${project.img}" alt="logo" />
    <div class="project_explanation">
      <p>${project.name}</p>
      <div>${project.description}</div>
    </div>
  `;

  projectElement.addEventListener('click', () => {
    openModal(project);
  });

  return projectElement;
};

const displayNoProjectsMessage = () => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('no_project');
  messageElement.innerHTML = 'There are no projects to display.';
  projectContainer.appendChild(messageElement);
};

window.onload = () => renderProjects(projects);

