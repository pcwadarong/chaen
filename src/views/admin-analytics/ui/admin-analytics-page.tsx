'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type {
  AdminArticleListItem,
  AdminGoogleArticleTraffic,
} from '@/entities/article/model/types';
import type { PdfFileDownloadLog } from '@/entities/pdf-file/model/types';
import { Link } from '@/i18n/navigation';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { AdminTable } from '@/shared/ui/admin-table';
import { CollapsiblePanelHeader } from '@/shared/ui/collapsible-panel-header';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { AdminConsoleShell } from '@/widgets/admin-console';

type AdminAnalyticsPageProps = {
  activeSection?: 'dashboard';
  googleArticleTraffic: AdminGoogleArticleTraffic;
  pdfLogs: PdfFileDownloadLog[];
  signOutRedirectPath?: string;
  title?: string;
  topArticles: AdminArticleListItem[];
};

/**
 * 관리자 대시보드에서 내부 지표와 로그를 요약해 보여줍니다.
 */
export const AdminAnalyticsPage = ({
  activeSection = 'dashboard',
  googleArticleTraffic,
  pdfLogs,
  signOutRedirectPath = '/ko/admin/login',
  title = 'Dashboard',
  topArticles,
}: AdminAnalyticsPageProps) => {
  const summaryTitleId = React.useId();
  const topArticlesTitleId = React.useId();
  const googleTrafficTitleId = React.useId();
  const pdfLogsTitleId = React.useId();
  const [isSummaryCollapsed, setIsSummaryCollapsed] = React.useState(false);
  const [isTopArticlesCollapsed, setIsTopArticlesCollapsed] = React.useState(false);
  const [isGoogleTrafficCollapsed, setIsGoogleTrafficCollapsed] = React.useState(false);
  const [isPdfLogsCollapsed, setIsPdfLogsCollapsed] = React.useState(false);
  const latestArticleViewCount = topArticles[0]?.view_count ?? 0;
  const latestPdfSourceCount = pdfLogs.length;
  const googleClicksLabel =
    googleArticleTraffic.status === 'configured'
      ? String(googleArticleTraffic.totalClicks)
      : googleArticleTraffic.status === 'error'
        ? '오류'
        : '연결 필요';

  return (
    <AdminConsoleShell
      activeSection={activeSection}
      signOutRedirectPath={signOutRedirectPath}
      title={title}
    >
      <section aria-labelledby={summaryTitleId} className={summaryPanelClass}>
        <CollapsiblePanelHeader
          className={summaryTitleClass}
          isCollapsed={isSummaryCollapsed}
          onToggle={() => setIsSummaryCollapsed(previous => !previous)}
          title={<span className={summaryEyebrowClass}>Overview</span>}
          titleId={summaryTitleId}
        />
        {!isSummaryCollapsed ? (
          <div className={summaryMetricGridClass}>
            <article className={metricCardClass}>
              <span className={metricLabelClass}>PDF 최근 로그</span>
              <strong className={metricValueClass}>{latestPdfSourceCount}</strong>
            </article>
            <article className={metricCardClass}>
              <span className={metricLabelClass}>Top article views</span>
              <strong className={metricValueClass}>{latestArticleViewCount}</strong>
            </article>
            <article className={metricCardClass}>
              <span className={metricLabelClass}>Google article clicks</span>
              <strong className={metricValueClass}>{googleClicksLabel}</strong>
            </article>
          </div>
        ) : null}
      </section>

      <section className={detailGridClass}>
        <section aria-labelledby={topArticlesTitleId} className={panelClass}>
          <CollapsiblePanelHeader
            isCollapsed={isTopArticlesCollapsed}
            onToggle={() => setIsTopArticlesCollapsed(previous => !previous)}
            title="Top 5 아티클"
            titleId={topArticlesTitleId}
          />
          {!isTopArticlesCollapsed ? (
            <ol className={rankListClass}>
              {topArticles.map(article => (
                <li className={rankListItemClass} key={article.id}>
                  <div className={rankMetaClass}>
                    {article.slug ? (
                      <Link
                        className={articleLinkClass}
                        href={`/articles/${resolvePublicContentPathSegment(article)}`}
                      >
                        {article.title}
                      </Link>
                    ) : (
                      <strong className={articleTitleFallbackClass}>{article.title}</strong>
                    )}
                    <span className={rankMetaSubClass}>
                      {article.publish_at?.slice(0, 10) ?? '-'}
                    </span>
                  </div>
                  <span className={rankValueClass}>{article.view_count ?? 0}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        <div className={rightPanelStackClass}>
          <section aria-labelledby={googleTrafficTitleId} className={panelClass}>
            <CollapsiblePanelHeader
              isCollapsed={isGoogleTrafficCollapsed}
              onToggle={() => setIsGoogleTrafficCollapsed(previous => !previous)}
              title="Google 아티클 검색 유입"
              titleId={googleTrafficTitleId}
            />
            {!isGoogleTrafficCollapsed ? (
              googleArticleTraffic.status === 'configured' ? (
                <AdminTable className={tableInsetClass}>
                  <thead>
                    <tr>
                      <th>페이지</th>
                      <th>클릭</th>
                      <th>노출</th>
                      <th>CTR</th>
                      <th>평균 순위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {googleArticleTraffic.items.map(item => (
                      <tr key={item.url}>
                        <td>
                          <a
                            className={externalArticleLinkClass}
                            aria-label={`${item.path} (새 창에서 열림)`}
                            href={item.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {item.path}
                            <span className={srOnlyClass}> (새 창에서 열림)</span>
                          </a>
                        </td>
                        <td>{item.clicks}</td>
                        <td>{item.impressions}</td>
                        <td>{`${(item.ctr * 100).toFixed(1)}%`}</td>
                        <td>{item.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <p className={placeholderTextClass}>
                  {googleArticleTraffic.status === 'error'
                    ? `Search Console 조회 중 오류가 발생했습니다. ${googleArticleTraffic.message ?? ''}`.trim()
                    : 'Search Console 서비스 계정과 사이트 속성 설정이 필요합니다.'}
                </p>
              )
            ) : null}
          </section>

          <section aria-labelledby={pdfLogsTitleId} className={panelClass}>
            <CollapsiblePanelHeader
              isCollapsed={isPdfLogsCollapsed}
              onToggle={() => setIsPdfLogsCollapsed(previous => !previous)}
              title="PDF 로그"
              titleId={pdfLogsTitleId}
            />
            {!isPdfLogsCollapsed ? (
              <AdminTable className={tableInsetClass} tableClassName={pdfTableClass}>
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>source</th>
                    <th>utm_source</th>
                    <th>referer</th>
                    <th>파일</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.created_at.slice(0, 16).replace('T', ' ')}</td>
                      <td>{log.source}</td>
                      <td>{log.utm_source ?? '-'}</td>
                      <td>{log.referer_path ?? log.referer ?? '-'}</td>
                      <td>{log.asset_key}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : null}
          </section>
        </div>
      </section>
    </AdminConsoleShell>
  );
};

const summaryPanelClass = css({
  display: 'grid',
  gap: '3',
  padding: { base: '4', lg: '4.5' },
  borderRadius: '3xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surface',
});

const summaryEyebrowClass = css({
  color: 'muted',
  fontSize: 'xs',
  letterSpacing: '[0.12em]',
  textTransform: 'uppercase',
});

const summaryTitleClass = css({
  margin: '0',
});

const summaryMetricGridClass = css({
  display: 'flex',
  gap: '2',
  overflowX: 'auto',
  paddingBottom: '1',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  md: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    overflowX: 'visible',
    paddingBottom: '0',
  },
  lg: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
});

const metricCardClass = css({
  display: 'grid',
  gap: '1.5',
  minWidth: { base: '48', md: '0' },
  padding: '3',
  borderRadius: '2xl',
  background: 'surfaceMuted',
  md: {
    minWidth: '0',
  },
});

const metricLabelClass = css({
  color: 'muted',
  fontSize: 'xs',
});

const metricValueClass = css({
  fontSize: { base: 'xl', lg: '2xl' },
  lineHeight: 'tight',
  letterSpacing: '[-0.03em]',
});

const detailGridClass = css({
  display: 'grid',
  gap: '3',
  alignItems: 'start',
  gridTemplateColumns: 'minmax(0, 0.78fr) minmax(0, 1.22fr)',
  _tabletDown: {
    gridTemplateColumns: '1fr',
  },
});

const rightPanelStackClass = css({
  display: 'grid',
  gap: '3',
  alignContent: 'start',
});

const panelClass = css({
  display: 'grid',
  gap: '3',
  padding: { base: '4', lg: '4.5' },
  borderRadius: '3xl',
  border: '[1px solid var(--colors-border)]',
  background: 'surface',
});

const rankListClass = css({
  listStyle: 'none',
  margin: '0',
  padding: '0',
  display: 'grid',
});

const rankListItemClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(0,1fr) auto]',
  gap: '3',
  alignItems: 'start',
  paddingY: '2.5',
  borderBottom: '[1px solid var(--colors-border-subtle)]',
  '&:last-child': {
    borderBottom: 'none',
    paddingBottom: '0',
  },
});

const rankMetaClass = css({
  display: 'grid',
  gap: '0.5',
  minWidth: '0',
});

const articleLinkClass = css({
  display: 'block',
  fontWeight: 'semibold',
  lineClamp: '3',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
    textUnderlineOffset: '[0.18em]',
  },
});

const articleTitleFallbackClass = css({
  display: 'block',
  fontWeight: 'semibold',
  lineClamp: '3',
});

const rankMetaSubClass = css({
  color: 'muted',
  fontSize: 'xs',
});

const rankValueClass = css({
  minWidth: { base: '10', md: '12' },
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const tableInsetClass = css({
  borderRadius: 'xl',
});

const externalArticleLinkClass = css({
  color: 'text',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  lineClamp: '2',
  textDecoration: 'none',
  _hover: {
    color: 'primary',
    textDecoration: 'underline',
  },
});

const pdfTableClass = css({
  tableLayout: 'fixed',
  '& th:nth-child(1), & td:nth-child(1)': {
    width: { base: '28', md: '32', lg: '36' },
  },
  '& th:nth-child(2), & td:nth-child(2)': {
    width: { base: '20', md: '24', lg: '28' },
  },
  '& th:nth-child(3), & td:nth-child(3)': {
    width: { base: '20', md: '24', lg: '28' },
  },
  '& th:nth-child(4), & td:nth-child(4)': {
    width: { base: '20', md: '24', lg: '24' },
  },
  '& th:nth-child(5), & td:nth-child(5)': {
    width: { base: '24', md: '28', lg: '32' },
  },
  '& td': {
    wordBreak: 'break-word',
  },
});

const placeholderTextClass = css({
  margin: '0',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'relaxed',
});
