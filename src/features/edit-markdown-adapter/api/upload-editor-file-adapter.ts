import { uploadEditorFile } from '@/entities/editor/api/upload-editor-file';

/**
 * 현재 앱의 editor 첨부 파일 업로드 구현을 markdown editor package 후보 UI에 연결합니다.
 * package extraction 전까지는 이 adapter가 기존 앱 API를 그대로 위임합니다.
 */
export const uploadEditorFileAdapter = uploadEditorFile;
