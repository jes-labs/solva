export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  cover: string;
  coverAlt: string;
  featured: boolean;
  readingMinutes: number;
}

export interface Post {
  meta: PostMeta;
  body: string;
}
