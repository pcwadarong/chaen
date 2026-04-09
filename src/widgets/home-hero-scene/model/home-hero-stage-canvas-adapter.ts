type InitializeHomeHeroStageCanvasInput = Readonly<{
  canvasElement: HTMLCanvasElement;
  setClearColor: (color: number, alpha?: number) => void;
}>;

/**
 * 홈 히어로 stage에서 생성된 three canvas DOM 속성을 초기화합니다.
 * 접근성 속성과 pointer 제어를 맞추고, 배경 clearColor를 투명으로 고정해 stage와 DOM shell이 자연스럽게 겹치도록 합니다.
 */
export const initializeHomeHeroStageCanvas = ({
  canvasElement,
  setClearColor,
}: InitializeHomeHeroStageCanvasInput) => {
  canvasElement.id = 'three-canvas';
  canvasElement.setAttribute('aria-hidden', 'true');
  canvasElement.setAttribute('role', 'presentation');
  canvasElement.style.touchAction = 'none';
  setClearColor(0x000000, 0);
};
