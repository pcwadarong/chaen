declare module '*.svg' {
  import type React from 'react';

  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.svg?url' {
  const content: any;
  export default content;
}
