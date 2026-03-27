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

  it('laptop click은 프로젝트 뷰 이동 콜백을 호출해야 한다', () => {
    const laptopMesh = createMesh('laptop');
    const onBrowseProjects = vi.fn();

    const { result } = renderHook(() =>
      useInteractionActions({
        onBrowseProjects,
        onOpenImageViewer: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleMeshClick(laptopMesh);
    });

    expect(onBrowseProjects).toHaveBeenCalledOnce();
  });

  it('camera 계열 click은 이미지뷰어 열기 콜백을 호출해야 한다', () => {
    const onBrowseProjects = vi.fn();
    const onOpenImageViewer = vi.fn();
    const cameraLensMesh = createMesh('camera_lens');

    const { result } = renderHook(() =>
      useInteractionActions({
        onBrowseProjects,
        onOpenImageViewer,
      }),
    );

    act(() => {
      result.current.handleMeshClick(cameraLensMesh);
    });

    expect(onOpenImageViewer).toHaveBeenCalledOnce();
    expect(onBrowseProjects).not.toHaveBeenCalled();
  });

  it('bass_body click은 프로젝트 뷰 이동 콜백을 호출해야 한다', () => {
    const bassBodyMesh = createMesh('bass_body');
    const onBrowseProjects = vi.fn();
    const onOpenImageViewer = vi.fn();

    const { result } = renderHook(() =>
      useInteractionActions({
        onBrowseProjects,
        onOpenImageViewer,
      }),
    );

    act(() => {
      result.current.handleMeshClick(bassBodyMesh);
    });

    expect(onBrowseProjects).toHaveBeenCalledOnce();
    expect(onOpenImageViewer).not.toHaveBeenCalled();
  });
});
