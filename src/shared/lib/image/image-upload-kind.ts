/**
 * 이미지 업로드의 용도를 구분하는 타입입니다.
 * `content`는 본문 이미지, `thumbnail`은 썸네일 용도로 사용되며 저장 경로와 최적화 정책 결정에 전달됩니다.
 */
export type EditorImageUploadKind = 'content' | 'thumbnail';
