import { uploadEditorVideo } from '@/entities/editor/api/upload-editor-video';

/**
 * 현재 앱의 editor 영상 업로드 구현을 markdown editor package 후보 UI에 연결합니다.
 * 추후 host app 교체 시에도 modal은 이 adapter 계약만 바라보도록 하기 위한 얇은 위임 계층입니다.
 */
export const uploadEditorVideoAdapter = uploadEditorVideo;
