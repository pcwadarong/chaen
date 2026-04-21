# chaen

## 소개

`chaen`은 블로그, 프로젝트 아카이브, 이력서, 방명록을 하나의 흐름으로 엮은 개인 웹 아카이브입니다.
작업 과정에서 쌓인 기록과 구현 맥락까지 함께 남기는 데 초점을 두고 있습니다.
인터랙션이 있는 홈 화면, 태그와 검색으로 탐색할 수 있는 기록, 언어별 웹 이력서와 PDF, 내부 관리 화면까지 한곳에서 이어지도록 구성했습니다.

<br>

## 주요 특징

- **첫 인상을 만드는 반응형 3D 홈 씬**: 화면 크기에 맞춰 밀도와 구성이 달라지는 3D 랜딩으로 사이트의 분위기를 먼저 전달합니다.
- **네 개 언어로 이어지는 아카이브**: 한국어, 영어, 일본어, 프랑스어를 지원하고, 번역이 아직 비어 있는 문서도 준비된 언어로 자연스럽게 이어서 볼 수 있습니다.
- **웹에서 읽고 PDF로 가져가는 이력서**: 브라우저에서 바로 읽을 수 있는 버전과 공유·보관용 PDF를 함께 제공합니다.
- **흐름이 끊기지 않는 기록 탐색**: 태그, 검색, 페이지 단위 아카이브를 오가며 원하는 글과 프로젝트를 빠르게 따라갈 수 있습니다.
- **직접 운영하는 내부 CMS**: 문서, 에셋, 분석 흐름을 한곳에서 관리하고, 전용 에디터는 [chaeditor](https://github.com/pcwadarong/chaeditor)로 분리해 운영합니다.

<br>

## 구성

- `Home`: 인터랙티브 랜딩과 연락 동선
- `Resume`: 웹용 이력서 및 언어별 PDF 제공
- `Project`: 프로젝트 목록과 웹용 포트폴리오 제공
- `Articles`: 기술 글과 기록 아카이브
- `Guest`: 방명록 기반의 방문자 메시지 공간
- `Admin`: 문서 편집, 에셋 관리, 조회수 및 검색 분석을 위한 관리자 전용 공간

<br>

## 🛠️ 기술 스택

### Core

<div style="text-align: left;">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white">
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white">
    <img src="https://img.shields.io/badge/Panda%20CSS-EDEDED?style=flat&logo=css&logoColor=111111">
    <img src="https://img.shields.io/badge/Husky-24292E?style=flat&logo=git&logoColor=white">
    <img src="https://img.shields.io/badge/lint--staged-6C47FF?style=flat&logo=lintstaged&logoColor=white">
</div>

### Frontend & Experience

<div style="text-align: left;">
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=0A0A0A">
    <img src="https://img.shields.io/badge/next--intl-000000?style=flat&logo=nextdotjs&logoColor=white">
    <img src="https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=0A0A0A">
    <img src="https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white">
    <img src="https://img.shields.io/badge/SVGR-FFB13B?style=flat&logo=svg&logoColor=0A0A0A">
    <img src="https://img.shields.io/badge/Chaeditor-111111?style=flat&logoColor=white">
</div>

### Content & Data

<div style="text-align: left;">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white">
    <img src="https://img.shields.io/badge/Google%20APIs-4285F4?style=flat&logo=google&logoColor=white">
    <img src="https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white">
</div>

### Testing & Quality

<div style="text-align: left;">
    <img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white">
    <img src="https://img.shields.io/badge/Prettier-F7B93E?style=flat&logo=prettier&logoColor=0A0A0A">
    <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white">
    <img src="https://img.shields.io/badge/Commitizen-3B82F6?style=flat&logo=git&logoColor=white">
</div>
