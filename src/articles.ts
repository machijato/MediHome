import matter from 'gray-matter';
import { marked } from 'marked';
import { Article, MOCK_ARTICLES } from './constants';

type ArticleFrontmatter = {
  title?: string;
  excerpt?: string;
  category?: Article['category'];
  date?: string;
  coverImage?: string;
  isPaid?: boolean;
};

type MarkdownModule = string;

const articleModules = import.meta.glob('/content/articles/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, MarkdownModule>;

const normalizeCoverImage = (coverImage: string | undefined, id: string) => {
  if (!coverImage) {
    return `https://picsum.photos/seed/${id}/800/600`;
  }

  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage;
  }

  if (coverImage.startsWith('/articles/')) {
    return coverImage;
  }

  const fileName = coverImage.split('/').pop()?.trim() ?? '';
  if (fileName) {
    const sanitized = fileName.replace(/\s+/g, '-').toLowerCase();
    return `/articles/${sanitized}`;
  }

  return coverImage.startsWith('/') ? coverImage : `/${coverImage}`;
};

const markdownArticles: Article[] = Object.entries(articleModules)
  .map(([path, markdownSource]) => {
    const parsed = matter(markdownSource);
    const frontmatter = parsed.data as ArticleFrontmatter;
    const articleBody = parsed.content.trim();
    const renderedBody = marked.parse(articleBody);
    const id = path.split('/').pop()?.replace(/\.md$/, '') ?? path;

    return {
      id,
      title: frontmatter.title ?? id,
      excerpt: frontmatter.excerpt ?? articleBody.slice(0, 200),
      excerptHtml: typeof renderedBody === 'string' ? renderedBody : '',
      category: frontmatter.category ?? 'Novosti',
      date: frontmatter.date ?? '',
      image: normalizeCoverImage(frontmatter.coverImage, id),
      isPaid: frontmatter.isPaid
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export const ARTICLES: Article[] = markdownArticles.length > 0 ? markdownArticles : MOCK_ARTICLES;
