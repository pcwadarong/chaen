export type ArticleItem = {
  id: string;
  tags: string[];
  thumbnailUrl: string;
};

export const articleItems: ArticleItem[] = [
  {
    id: 'typography-rhythm',
    tags: ['typography', 'i18n', 'designSystem'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200',
  },
  {
    id: 'svgr-turbopack',
    tags: ['nextjs', 'svg', 'buildTooling'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200',
  },
  {
    id: 'supabase-ssr-boundary',
    tags: ['supabase', 'ssr', 'architecture'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200',
  },
];
