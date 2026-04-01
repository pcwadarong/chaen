import { uploadEditorImage } from '@/entities/editor/api/upload-editor-image';

/**
 * 현재 앱의 editor 이미지 업로드 구현을 markdown editor package 후보 UI에 연결합니다.
 * 이후 외부 package로 추출할 때는 이 adapter만 host app 쪽에 남기고 UI는 동일한 prop 계약을 유지할 수 있습니다.
 */
export const uploadEditorImageAdapter = uploadEditorImage;
