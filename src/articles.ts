import matter from 'gray-matter';
import { marked } from 'marked';
import { MOCK_ARTICLES } from './constants';

export interface MarkdownArticle {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  coverImage: string;
  content: string;
  html: string;
}

interface Frontmatter {
  title?: string;
  date?: string;
  category?: string;
  excerpt?: string;
  coverImage?: string;
}

const markdownModules = import.meta.glob('/content/articles/*.md', { eager: true, as: 'raw' }) as Record<string, string>;

const byDateDesc = (a: MarkdownArticle, b: MarkdownArticle) => {
  const aDate = Date.parse(a.date);
  const bDate = Date.parse(b.date);
  if (Number.isNaN(aDate) || Number.isNaN(bDate)) {
    return b.date.localeCompare(a.date);
  }
  return bDate - aDate;
};

const parseMarkdownArticles = (): MarkdownArticle[] => {
  return Object.entries(markdownModules)
    .map(([filePath, source]) => {
      const slug = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
      const { data, content } = matter(source);
      const frontmatter = data as Frontmatter;

      if (!slug || !frontmatter.title || !frontmatter.date || !frontmatter.category || !frontmatter.excerpt || !frontmatter.coverImage) {
        return null;
      }

      return {
        slug,
        title: frontmatter.title,
        date: frontmatter.date,
        category: frontmatter.category,
        excerpt: frontmatter.excerpt,
        coverImage: frontmatter.coverImage,
        content,
        html: marked.parse(content) as string,
      };
    })
    .filter((article): article is MarkdownArticle => article !== null)
    .sort(byDateDesc);
};

const fallbackArticles: MarkdownArticle[] = MOCK_ARTICLES.map((article) => ({
  slug: article.id,
  title: article.title,
  date: article.date,
  category: article.category,
  excerpt: article.excerpt,
  coverImage: article.image,
  content: article.excerpt,
  html: marked.parse(article.excerpt) as string,
}));

export const ARTICLES = (() => {
  const parsed = parseMarkdownArticles();
  return parsed.length > 0 ? parsed : fallbackArticles;
})();

export const getArticleBySlug = (slug: string) => ARTICLES.find((article) => article.slug === slug);
