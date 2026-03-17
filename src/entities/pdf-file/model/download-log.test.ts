import {
  doesPdfDownloadSourceMatchKind,
  extractPdfDownloadRequestMetadata,
  resolveCountryCode,
  resolveIpAddress,
  resolvePdfDownloadDeviceType,
} from '@/entities/pdf-file/model/download-log';

describe('pdf download log helpers', () => {
  it('referer에서 same-origin path와 utm_source를 추출한다', () => {
    const metadata = extractPdfDownloadRequestMetadata({
      request: new Request('https://chaen.dev/api/pdf/file/resume-ko?source=resume-page', {
        headers: {
          referer: 'https://chaen.dev/ko/resume?utm_source=linkedin&utm_medium=social',
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'x-forwarded-for': '203.0.113.10, 10.0.0.1',
          'x-vercel-ip-country': 'kr',
        },
      }),
    });

    expect(metadata).toEqual({
      countryCode: 'KR',
      deviceType: 'mobile',
      ip: '203.0.113.10',
      referer: 'https://chaen.dev',
      refererPath: '/ko/resume',
      utmSource: 'linkedin',
    });
  });

  it('cross-origin referer는 referer_path를 남기지 않는다', () => {
    const metadata = extractPdfDownloadRequestMetadata({
      request: new Request('https://chaen.dev/api/pdf/file/portfolio-en?source=project-page', {
        headers: {
          referer: 'https://google.com/search?q=chaen&utm_source=google',
        },
      }),
    });

    expect(metadata.referer).toBe('https://google.com');
    expect(metadata.refererPath).toBeNull();
    expect(metadata.utmSource).toBe('google');
  });

  it('국가 코드는 Vercel 헤더를 우선한다', () => {
    const headers = new Headers({
      'cf-ipcountry': 'us',
      'x-vercel-ip-country': 'kr',
    });

    expect(resolveCountryCode(headers)).toBe('KR');
  });

  it('x-forwarded-for가 있으면 첫 번째 IP를 사용한다', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.44',
      'x-forwarded-for': '198.51.100.7, 10.0.0.1',
      'x-real-ip': '198.51.100.9',
    });

    expect(resolveIpAddress(headers)).toBe('198.51.100.7');
  });

  it('User-Agent를 mobile, tablet, desktop, bot, unknown으로 분류한다', () => {
    expect(
      resolvePdfDownloadDeviceType(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
      ),
    ).toBe('mobile');
    expect(
      resolvePdfDownloadDeviceType(
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('tablet');
    expect(
      resolvePdfDownloadDeviceType(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      ),
    ).toBe('desktop');
    expect(
      resolvePdfDownloadDeviceType('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'),
    ).toBe('bot');
    expect(resolvePdfDownloadDeviceType(null)).toBe('unknown');
  });

  it('source와 kind의 대응 관계를 검증한다', () => {
    expect(doesPdfDownloadSourceMatchKind('resume-page', 'resume')).toBe(true);
    expect(doesPdfDownloadSourceMatchKind('resume-page', 'portfolio')).toBe(false);
    expect(doesPdfDownloadSourceMatchKind('project-page', 'portfolio')).toBe(true);
  });
});
