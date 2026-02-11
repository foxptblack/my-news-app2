
import { TabConfig } from './types';

// 初回起動時のデフォルト設定
export const DEFAULT_TABS: TabConfig[] = [
  { id: 'tab-1', label: 'バス減便', icon: 'fa-bus', keyword: 'バス 減便' },
  { id: 'tab-2', label: 'バス実証実験', icon: 'fa-flask', keyword: 'バス 実証実験' },
  { id: 'tab-3', label: 'バス自動運転', icon: 'fa-robot', keyword: 'バス 自動運転' },
  { id: 'tab-4', label: 'ガジェット', icon: 'fa-laptop', keyword: 'https://www.gizmodo.jp/index.xml' },
  { id: 'tab-5', label: '多摩の歴史', icon: 'fa-landmark', keyword: '多摩 歴史' },
];

// タブの最大作成数
export const MAX_TABS = 7;
