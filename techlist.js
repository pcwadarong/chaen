const techList = {
  Frontend: [
    'HTML',
    'CSS',
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Recoil',
    'Zustand',
    'Tailwind CSS',
    'SASS',
    'Bootstrap',
  ],
  Backend: ['Vercel', 'Firebase', 'Fake Store API', 'Python'],
  Design: [
    'Figma',
    'Adobe Illustrator',
    'Adobe XD',
    'Adobe After Effect',
    'Adobe Photoshop',
  ],
  Collaborate: ['Notion', 'Slack'],
  Others: ['continued..'],
  Certificate: ['continued..'],
};

const techElements = {
  Frontend: document.getElementById('tech_front'),
  Backend: document.getElementById('tech_back'),
  Design: document.getElementById('tech_design'),
  Collaborate: document.getElementById('tech_collaborate'),
  Others: document.getElementById('tech_others'),
  Certificate: document.getElementById('tech_certificate'),
};

const techListContainer = document.getElementById('tech_list');
const techPartName = document.getElementById('tech_part');

const changeTechList = (part) => {
  const techItems = techList[part] || techList.Frontend;
  techPartName.innerHTML = part;
  techListContainer.innerHTML = techItems
    .map((item) => `<li>${item}</li>`)
    .join('');
};

window.onload = () => {
  changeTechList('Frontend');
};

Object.keys(techElements).forEach((part) => {
  techElements[part].addEventListener('click', () => changeTechList(part));
});
