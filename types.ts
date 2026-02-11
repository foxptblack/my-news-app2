
export type Category = string;

export interface NewsArticle {
  id: string;
  category: Category;
  title: string;
  date: string;
  pubDate: string; // ISO 8601 string for precise comparison
  summary: string;
  imageUrl: string;
  source: string;
  link: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  keyword: string; // 検索キーワード または RSS URL
}
