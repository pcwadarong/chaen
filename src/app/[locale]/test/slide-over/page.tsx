import { SlideOverE2eFixture } from '@/shared/ui/slide-over/slide-over-e2e-fixture';

/**
 * SlideOver 브라우저 계약 검증용 fixture 페이지를 렌더링합니다.
 *
 * - 초기 포커스 진입과 포커스 트랩
 * - Escape 및 backdrop 닫힘
 * - 종료 애니메이션 뒤 DOM 제거
 *
 * @returns SlideOverE2eFixture를 포함한 JSX.Element입니다.
 */
const SlideOverTestPage = () => <SlideOverE2eFixture />;

export default SlideOverTestPage;
