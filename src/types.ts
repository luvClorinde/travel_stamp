export type RecordType = 'text' | 'image';

export interface MapMeta {
  id: string;
  shareId: string;
  name: string;
  type: 'domestic' | 'international';
  createdAt: string;
}

export interface TravelRecord {
  id: string;
  type: RecordType;
  content: string;     // テキスト投稿の本文、画像投稿では空文字
  caption?: string;    // 画像投稿のキャプション
  photos?: string[];   // 画像投稿の storage_path 一覧（表示時に signed URL を生成する）
  createdAt: string;
  mapIds: string[];    // この投稿が紐づくマップID一覧
}

export interface TravelData {
  [locationId: string]: TravelRecord[];
}
