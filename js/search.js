// Search bar

import { projects } from './projects.js';
import { renderProjects } from './list.js';

const input = document.getElementById('search');
const btn = document.getElementById('search_btn');

const showAnswer = () => {
  const searchQuery = input.value.toLowerCase();
  const searchPattern = new RegExp(searchQuery.split('').join('.*'));
  const filteredProjects = {};

  for (const key in projects) {
    const projectNameLower = projects[key].name.toLowerCase();
    if (searchPattern.test(projectNameLower)) {
      filteredProjects[key] = projects[key];
    }
  }
  renderProjects(filteredProjects);
};

btn.addEventListener('click', showAnswer);
input.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    showAnswer();
  }
});
