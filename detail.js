// Modal that shows detailed information of each project

const projects = {
  Uniform: {
    name: 'Uniform',
    img: '../assets/images/uniform.svg',
    description: 'Survey Form Service for University Students',
    github: 'https://github.com/pcwadarong/Uni-Form',
    website: 'https://uniform.com',
    tech: {
      frontend: ['React', 'TypeScript', 'Tailwind CSS', 'Zustand'],
      backend: ['Vercel', 'Firebase Storage'],
      design: ['Figma', 'SVG'],
      others: ['Notion', 'VS Code', 'Git'],
    },
  },
  AC: {
    name: 'Anything you crave',
    img: '../assets/images/ac.svg',
    description: 'E-commerce Shopping Mall by React, Recoil, Vercel',
    github:
      'https://github.com/pcwadarong/zerobase-FE/tree/main/REACT%20%2B%20TS',
    website: 'https://anything-you-crave.vercel.app/',
    tech: {
      frontend: ['React', 'Recoil'],
      backend: ['Vercel', 'Fake Store API'],
      design: ['Figma'],
      others: ['Notion', 'VS Code', 'Git'],
    },
  },
  Dalgona: {
    name: 'Dalgona Squide Game',
    img: '../assets/images/dalgona.svg',
    description: 'Introduce Dalgona with Scrolling Animation & Gamification',
    github: 'https://github.com/example/dalgona',
    website: 'https://dalgona.example.com',
    tech: {
      frontend: ['React', 'JavaScript', 'CSS'],
      backend: [],
      design: ['Figma', 'Adobe After Effect', 'Clip Studio'],
      others: ['VS Code', 'Git'],
    },
  },
  Coplant: {
    name: 'Coplant',
    img: '../assets/images/coplant.svg',
    description: 'Companion plant selling site',
    github: 'https://github.com/pcwadarong/COPLANT',
    website: '',
    tech: {
      frontend: ['React', 'Redux'],
      backend: [],
      design: ['Figma'],
      others: ['VS Code', 'Git'],
    },
  },
  ChaCha: {
    name: 'Cha Cha',
    img: '../assets/images/chacha.svg',
    description: 'Personal Tea Recommending Service with Backend, team project',
    github: 'https://github.com/pcwadarong/chacha',
    website: '',
    tech: {
      frontend: ['React', 'JavaScript'],
      backend: ['MongoDB', 'Python'],
      design: ['Figma'],
      others: ['Notion', 'VS Code', 'Git'],
    },
  },
};

const projectContainer = document.querySelector('.projects');
const modalBg = document.getElementById('project_modal_background');
const modal = document.getElementById('project_modal');
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

const renderProjects = () => {
  projectContainer.innerHTML = '<h2 class="semi_title">Projects</h2>';
  for (const key in projects) {
    const project = projects[key];

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

    projectContainer.appendChild(projectElement);
  }
};

const updateStackElements = (tech, element) => {
  if (tech.length > 0) {
    element.container.style.display = 'flex';
    element.list.innerHTML = tech.map((item) => `<li>${item}</li>`).join('');
  } else {
    element.container.style.display = 'none';
  }
};

const openModal = (project) => {
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

window.onload = renderProjects;
