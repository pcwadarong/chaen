import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import {
  PublishScheduleSection,
  PublishThumbnailSection,
  PublishVisibilitySection,
} from '@/widgets/editor/ui/publish/publish-panel-sections';

const imageSourceFieldProps = vi.fn();

vi.mock('@/shared/ui/image-source-field', () => ({
  ImageSourceField: (props: unknown) => {
    imageSourceFieldProps(props);
    return <div data-testid="image-source-field" />;
  },
}));

describe('PublishVisibilitySection', () => {
  it('공개 설정 변경을 전달한다', () => {
    const onChange = vi.fn();

    render(<PublishVisibilitySection onChange={onChange} value="public" />);

    fireEvent.click(screen.getByRole('radio', { name: '비공개' }));

    expect(onChange).toHaveBeenCalledWith('private');
  });
});

describe('PublishScheduleSection', () => {
  it('이미 공개된 콘텐츠면 예약 발행 옵션을 비활성화하고 안내 문구를 노출한다', () => {
    render(
      <PublishScheduleSection
        dateInput=""
        isScheduleLocked
        minDateInput="2026-03-17"
        onDateChange={vi.fn()}
        onPublishModeChange={vi.fn()}
        onTimeChange={vi.fn()}
        publishMode="immediate"
        scheduledUtcIso={null}
        timeInput=""
      />,
    );
    const scheduledRadio = screen.getByRole('radio', { name: '예약 발행' });

    expect(scheduledRadio.getAttribute('disabled')).toBe('');
    expect(screen.getByRole('status').textContent).toBe(
      '이미 공개된 콘텐츠는 예약 발행으로 다시 전환할 수 없습니다.',
    );
  });
});

describe('PublishThumbnailSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이미지 소스 필드에 업로드/미리보기 props를 그대로 전달한다', () => {
    const onFileChange = vi.fn();
    const onThumbnailUrlChange = vi.fn();

    render(
      <PublishThumbnailSection
        error="썸네일 오류"
        isUploading
        onFileChange={onFileChange}
        onThumbnailUrlChange={onThumbnailUrlChange}
        thumbnailPreviewUrl="https://example.com/preview.png"
        thumbnailUrl="https://example.com/source.png"
      />,
    );

    expect(screen.getByTestId('image-source-field')).toBeTruthy();
    expect(imageSourceFieldProps).toHaveBeenCalledWith(
      expect.objectContaining({
        error: '썸네일 오류',
        isUploading: true,
        label: '썸네일',
        onFileChange,
        onValueChange: onThumbnailUrlChange,
        previewUrl: 'https://example.com/preview.png',
        value: 'https://example.com/source.png',
      }),
    );
  });
});
