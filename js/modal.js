// Modal that shows detailed information of each project

const modalBg = document.getElementById('project_modal_background');
const modalTitle = document.getElementById('project_title');
const modalImg = document.getElementById('project_img');
const modalDescription = document.getElementById('project_description');
const modalGithub = document.getElementById('project_github');
const modalWebsite = document.getElementById('project_website');
const stackElements = {
  frontend: {
    container: document.getElementById('stack_frontend_item'),
    list: document.getElementById('stack_front'),
  },
  backend: {
    container: document.getElementById('stack_backend_item'),
    list: document.getElementById('stack_back'),
  },
  design: {
    container: document.getElementById('stack_design_item'),
    list: document.getElementById('stack_design'),
  },
  others: {
    container: document.getElementById('stack_others_item'),
    list: document.getElementById('stack_others'),
  },
};

const updateStackElements = (tech, element) => {
  if (tech.length > 0) {
    element.container.style.display = 'flex';
    element.list.innerHTML = tech.map((item) => `<li>${item}</li>`).join('');
  } else {
    element.container.style.display = 'none';
  }
};

export const openModal = (project) => {
  modalTitle.textContent = project.name;
  modalImg.src = project.img;
  modalDescription.textContent = project.description;
  modalGithub.href = project.github;

  if (project.website) {
    modalWebsite.href = project.website;
    modalWebsite.style.display = 'block';
  } else {
    modalWebsite.style.display = 'none';
  }

  updateStackElements(project.tech.frontend, stackElements.frontend);
  updateStackElements(project.tech.backend, stackElements.backend);
  updateStackElements(project.tech.design, stackElements.design);
  updateStackElements(project.tech.others, stackElements.others);

  modalBg.style.display = 'block';
};

window.onclick = (event) => {
  if (event.target == modalBg) {
    modalBg.style.display = 'none';
  }
};
