import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ImageViewerModal } from '@/shared/ui/image-viewer/image-viewer-modal';

describe('ImageViewerModal', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  const labels = {
    actionBarAriaLabel: '이미지 액션 바',
    closeAriaLabel: '닫기',
    fitToScreenAriaLabel: '화면 맞춤',
    imageViewerAriaLabel: '이미지 뷰어',
    locateSourceAriaLabel: '이미지 위치로 글 이동',
    nextAriaLabel: '다음 이미지',
    previousAriaLabel: '이전 이미지',
    selectForFrameAriaLabel: '액자 이미지로 선택',
    selectForFrameLabel: '이 이미지 선택하기',
    thumbnailListAriaLabel: '썸네일 목록',
    zoomInAriaLabel: '확대',
    zoomOutAriaLabel: '축소',
  };

  const items = [
    { alt: '첫 번째 이미지', src: '/one.jpg' },
    { alt: '두 번째 이미지', src: '/two.jpg' },
  ];

  it('썸네일 버튼에 설명적인 접근성 라벨과 현재 상태를 제공한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: '첫 번째 이미지 1' }).getAttribute('aria-current'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: '두 번째 이미지 2' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('alt가 비어 있어도 이미지 뷰어 라벨 fallback을 사용한다', () => {
    render(
      <ImageViewerModal
        initialIndex={0}
        items={[{ alt: '', src: '/empty-alt.jpg' }]}
        labels={labels}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '이미지 뷰어 1' })).toBeTruthy();
  });

  it('remotePatterns에 없는 외부 이미지 URL도 그대로 렌더링한다', () => {
    render(
      <ImageViewerModal
        initialIndex={0}
        items={[{ alt: '외부 이미지', src: 'https://github.com/user-attachments/assets/demo' }]}
        labels={labels}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen
        .getAllByAltText('외부 이미지')
        .every(
          node => node.getAttribute('src') === 'https://github.com/user-attachments/assets/demo',
        ),
    ).toBe(true);
  });

  it('액션 바의 이미지 위치 버튼으로 원문 이미지 위치 이동을 요청한다', () => {
    const handleLocateSource = vi.fn();

    render(
      <ImageViewerModal
        initialIndex={0}
        items={items}
        labels={labels}
        onClose={vi.fn()}
        onLocateSource={handleLocateSource}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '이미지 위치로 글 이동' }));

    expect(handleLocateSource).toHaveBeenCalledWith(0);
  });

  it('원문 위치 이동 핸들러가 없으면 locate 버튼을 렌더링하지 않는다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '이미지 위치로 글 이동' })).toBeNull();
  });

  it('현재 이미지를 액자용으로 선택하는 버튼으로 선택 인덱스를 외부에 전달한다', () => {
    const handleSelectCurrentImage = vi.fn();

    render(
      <ImageViewerModal
        initialIndex={0}
        items={items}
        labels={labels}
        onClose={vi.fn()}
        onSelectCurrentImage={handleSelectCurrentImage}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '액자 이미지로 선택' }));

    expect(handleSelectCurrentImage).toHaveBeenCalledWith(0);
  });

  it('액자 선택 버튼 클릭은 backdrop 닫기로 이어지지 않는다', () => {
    const handleClose = vi.fn();
    const handleSelectCurrentImage = vi.fn();

    render(
      <ImageViewerModal
        initialIndex={0}
        items={items}
        labels={labels}
        onClose={handleClose}
        onSelectCurrentImage={handleSelectCurrentImage}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '액자 이미지로 선택' }));

    expect(handleSelectCurrentImage).toHaveBeenCalledWith(0);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('액자 선택 버튼은 눈에 띄는 텍스트 라벨을 함께 렌더링해야 한다', () => {
    render(
      <ImageViewerModal
        initialIndex={0}
        items={items}
        labels={labels}
        onClose={vi.fn()}
        onSelectCurrentImage={vi.fn()}
      />,
    );

    expect(screen.getByText('이 이미지 선택하기')).toBeTruthy();
  });

  it('액자 선택 핸들러가 없으면 선택 버튼을 렌더링하지 않는다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '액자 이미지로 선택' })).toBeNull();
  });

  it('액션 바 버튼 hover 시 상단 tooltip을 표시하고 leave 시 숨긴다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    const fitToScreenButton = screen.getByRole('button', { name: '화면 맞춤' });

    fireEvent.mouseEnter(fitToScreenButton);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('화면 맞춤');
    expect(tooltip.closest('[role="toolbar"]')).toBeNull();

    fireEvent.mouseLeave(fitToScreenButton);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('액션 바 버튼 click 시작 시에도 상단 tooltip을 표시한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    const fitToScreenButton = screen.getByRole('button', { name: '화면 맞춤' });

    fireEvent.pointerDown(fitToScreenButton);

    expect(screen.getByRole('tooltip').textContent).toBe('화면 맞춤');
  });

  it('이미지 내부 클릭은 backdrop 닫기로 이어지지 않는다', () => {
    const handleClose = vi.fn();

    render(
      <ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={handleClose} />,
    );

    fireEvent.click(document.querySelector('[data-image-viewer-image="true"]') as HTMLElement);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('썸네일 클릭은 backdrop 닫기로 이어지지 않는다', () => {
    const handleClose = vi.fn();

    render(
      <ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={handleClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '두 번째 이미지 2' }));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('액션 바 버튼 클릭은 backdrop 닫기로 이어지지 않는다', () => {
    const handleClose = vi.fn();

    render(
      <ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={handleClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '화면 맞춤' }));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('확대된 상태에서는 포인터 드래그로 이미지를 이동한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);
    const viewport = document.querySelector(
      '[data-image-viewer-viewport="true"]',
    ) as HTMLDivElement;
    const image = document.querySelector('[data-image-viewer-image="true"]') as HTMLImageElement;

    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(viewport, 'setPointerCapture', { configurable: true, value: vi.fn() });
    Object.defineProperty(viewport, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(viewport, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(image, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(image, 'clientHeight', { configurable: true, value: 100 });

    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '확대' }));
    }

    fireEvent.pointerDown(viewport, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 160, clientY: 120, pointerId: 1 });

    expect(image.style.transform).toContain('translate3d(');
    expect(image.style.transform).toContain('scale(2)');
    expect(image.style.transform).not.toContain('translate3d(0px, 0px, 0)');
  });

  it('확대 버튼을 여러 번 눌러도 계속 확대된다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    for (let step = 0; step < 6; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '확대' }));
    }

    expect(screen.getByText('250%')).toBeTruthy();
  });

  it('다음과 이전 전환 시 방향 데이터 속성을 적용한다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }));

    expect(
      document
        .querySelector('[data-transition-direction="next"]')
        ?.querySelector('[data-image-viewer-image="true"]'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '이전 이미지' }));

    expect(
      document
        .querySelector('[data-transition-direction="previous"]')
        ?.querySelector('[data-image-viewer-image="true"]'),
    ).toBeTruthy();
  });

  it('마우스 휠로 이미지를 확대할 수 있다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);
    const viewport = document.querySelector(
      '[data-image-viewer-viewport="true"]',
    ) as HTMLDivElement;

    fireEvent.wheel(viewport, { deltaY: -100 });

    expect(screen.getByText('125%')).toBeTruthy();
  });

  it('확대된 상태에서도 zoom dock 버튼을 계속 클릭할 수 있다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '확대' }));
    expect(screen.getByText('125%')).toBeTruthy();

    fireEvent.pointerDown(screen.getByRole('button', { name: '확대' }), { pointerId: 1 });
    fireEvent.click(screen.getByRole('button', { name: '축소' }));

    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('두 손가락 포인터 이동으로 이미지를 pinch 확대할 수 있다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);
    const viewport = document.querySelector(
      '[data-image-viewer-viewport="true"]',
    ) as HTMLDivElement;

    Object.defineProperty(viewport, 'setPointerCapture', { configurable: true, value: vi.fn() });
    Object.defineProperty(viewport, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(viewport, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });

    fireEvent.pointerDown(viewport, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerDown(viewport, {
      clientX: 200,
      clientY: 100,
      pointerId: 2,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(viewport, {
      clientX: 260,
      clientY: 100,
      pointerId: 2,
      pointerType: 'touch',
    });

    expect(screen.getByText('160%')).toBeTruthy();
  });

  it('화면 맞춤 버튼은 확대 상태를 기본 배율로 되돌린다', () => {
    render(<ImageViewerModal initialIndex={0} items={items} labels={labels} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '확대' }));
    fireEvent.click(screen.getByRole('button', { name: '화면 맞춤' }));

    expect(screen.getByText('100%')).toBeTruthy();
  });
});
