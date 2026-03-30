'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { PdfFileDownloadLog } from '@/entities/pdf-file/model/types';
import { Link } from '@/i18n/navigation';
import { resolvePublicContentPathSegment } from '@/shared/lib/content/public-content';
import { AdminTable } from '@/shared/ui/admin-table';
import { Button } from '@/shared/ui/button/button';
import { AdminConsoleShell } from '@/widgets/admin-console';

type AdminAnalyticsPageProps = {
  activeSection?: 'dashboard';
  locale: string;
  pdfLogs: PdfFileDownloadLog[];
  title?: string;
  topArticles: AdminArticleListItem[];
};

/**
 * 관리자 대시보드에서 내부 지표와 로그를 요약해 보여줍니다.
 */
export const AdminAnalyticsPage = ({
  activeSection = 'dashboard',
  locale,
  pdfLogs,
  title = 'Dashboard',
  topArticles,
}: AdminAnalyticsPageProps) => {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = React.useState(false);
  const latestArticleViewCount = topArticles[0]?.view_count ?? 0;
  const latestPdfSourceCount = pdfLogs.length;

  return (
    <AdminConsoleShell activeSection={activeSection} locale={locale} title={title}>
      <section className={summaryPanelClass}>
        <header className={summaryHeaderClass}>
          <div className={summaryCopyClass}>
            <span className={summaryEyebrowClass}>Overview</span>
          </div>
          <Button
            className={summaryToggleButtonClass}
            onClick={() => setIsSummaryCollapsed(previous => !previous)}
            size="sm"
            tone="white"
            variant="ghost"
          >
            {isSummaryCollapsed ? '펼치기' : '닫기'}
          </Button>
        </header>
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
              <strong className={metricValueClass}>연결 예정</strong>
            </article>
          </div>
        ) : null}
      </section>

      <section className={detailGridClass}>
        <section className={panelClass}>
          <header className={panelHeaderClass}>
            <h3 className={panelTitleClass}>Top 5 아티클</h3>
          </header>
          <ol className={rankListClass}>
            {topArticles.map(article => (
              <li className={rankListItemClass} key={article.id}>
                <div className={rankMetaClass}>
                  <Link
                    className={articleLinkClass}
                    href={`/articles/${resolvePublicContentPathSegment(article)}`}
                  >
                    {article.title}
                  </Link>
                  <span className={rankMetaSubClass}>
                    {article.publish_at?.slice(0, 10) ?? '-'}
                  </span>
                </div>
                <span className={rankValueClass}>{article.view_count ?? 0}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className={rightPanelStackClass}>
          <section className={panelClass}>
            <header className={panelHeaderClass}>
              <h3 className={panelTitleClass}>Google 아티클 검색 유입</h3>
            </header>
            <p className={placeholderTextClass}>
              Search Console 또는 GA4 연결 후 아티클 경로 기준 클릭, 노출, CTR, 평균 순위를 이
              영역에 표시합니다.
            </p>
          </section>

          <section className={panelClass}>
            <header className={panelHeaderClass}>
              <h3 className={panelTitleClass}>PDF 로그</h3>
            </header>
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

const summaryHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const summaryCopyClass = css({
  display: 'grid',
  gap: '1',
});

const summaryEyebrowClass = css({
  color: 'muted',
  fontSize: 'xs',
  letterSpacing: '[0.12em]',
  textTransform: 'uppercase',
});

const summaryToggleButtonClass = css({
  display: { base: 'inline-flex', md: 'none' },
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

const panelHeaderClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const panelTitleClass = css({
  margin: '0',
  fontSize: 'lg',
  lineHeight: 'tight',
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
