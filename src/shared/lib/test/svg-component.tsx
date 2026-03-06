import type { SVGProps } from 'react';
import React from 'react';

/**
 * Vitest 환경에서 SVG import를 대체하는 테스트 전용 컴포넌트입니다.
 */
const SvgComponent = (props: SVGProps<SVGSVGElement>) => <svg {...props} />;

export default SvgComponent;
