const techList = {
  front: [
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
  back: ['Vercel', 'Firebase', 'Fake Store API', 'Python'],
  design: [
    'Figma',
    'Adobe Illustrator',
    'Adobe XD',
    'Adobe After Effect',
    'Adobe Photoshop',
  ],
  collaborate: ['Notion', 'Slack'],
  others: ['continued..'],
  certificate: ['continued..'],
};

const techElements = {
  front: document.getElementById('tech_front'),
  back: document.getElementById('tech_backend'),
  design: document.getElementById('tech_design'),
  collaborate: document.getElementById('tech_collaborate'),
  others: document.getElementById('tech_others'),
  certificate: document.getElementById('tech_certificate'),
};

const techListContainer = document.getElementById('techlist');

const changeTechList = (part) => {
  const techItems = techList[part] || techList.front;
  techListContainer.innerHTML = techItems
    .map((item) => `<li>${item}</li>`)
    .join('');
};

changeTechList('front');

Object.keys(techElements).forEach((part) => {
  techElements[part].addEventListener('click', () => changeTechList(part));
});
