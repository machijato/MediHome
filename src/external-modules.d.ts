declare module 'gray-matter' {
  interface GrayMatterFile<T extends Record<string, unknown> = Record<string, unknown>> {
    data: T;
    content: string;
  }

  export default function matter<T extends Record<string, unknown> = Record<string, unknown>>(
    input: string
  ): GrayMatterFile<T>;
}

declare module 'marked' {
  export const marked: {
    parse(markdown: string): string | Promise<string>;
  };
}
