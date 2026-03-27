import { act, renderHook } from '@testing-library/react';
import { Object3D } from 'three';

import { useInteractionActions } from '@/features/interaction/model/useInteractionActions';

/**
 * 테스트용 interaction mesh를 이름 기준으로 생성합니다.
 */
const createMesh = (name: string) => {
  const mesh = new Object3D();
  mesh.name = name;

  return mesh;
};

describe('useInteractionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('laptop click은 현재 커밋 범위에서 추가 액션 없이 무시되어야 한다', () => {
    const laptopMesh = createMesh('laptop');

    const { result } = renderHook(() =>
      useInteractionActions({
        onOpenImageViewer: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleMeshClick(laptopMesh);
    });
  });

  it('camera 계열 click은 이미지뷰어 열기 콜백을 호출해야 한다', () => {
    const onOpenImageViewer = vi.fn();
    const cameraLensMesh = createMesh('camera_lens');

    const { result } = renderHook(() =>
      useInteractionActions({
        onOpenImageViewer,
      }),
    );

    act(() => {
      result.current.handleMeshClick(cameraLensMesh);
    });

    expect(onOpenImageViewer).toHaveBeenCalledOnce();
  });

  it('bass_body click은 현재 커밋 범위에서 추가 액션 없이 무시되어야 한다', () => {
    const bassBodyMesh = createMesh('bass_body');
    const onOpenImageViewer = vi.fn();

    const { result } = renderHook(() =>
      useInteractionActions({
        onOpenImageViewer,
      }),
    );

    act(() => {
      result.current.handleMeshClick(bassBodyMesh);
    });

    expect(onOpenImageViewer).not.toHaveBeenCalled();
  });
});
