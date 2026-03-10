type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * 구조화 데이터를 JSON-LD 스크립트로 주입합니다.
 */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data),
    }}
    type="application/ld+json"
  />
);
