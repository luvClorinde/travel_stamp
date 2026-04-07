export type RecordType = 'text' | 'image';

export interface MapMeta {
  id: string;
  shareId: string;
  name: string;
  type: 'domestic' | 'international';
  createdAt: string;
  viewEnabled: boolean;
  viewToken: string | null;
}

export interface PhotoDetail {
  id: string;
  storagePath: string;
}

export interface TravelRecord {
  id: string;
  type: RecordType;
  content: string;      // テキスト投稿の本文（画像投稿では空文字）
  caption?: string;     // 画像投稿のキャプション（= posts.body）
  photoDetails?: PhotoDetail[];  // 画像一覧（表示・編集に使用）
  createdAt: string;
  mapIds: string[];
  authorId: string;     // 投稿作成者の user_id
  pinnedAt: string | null; // ピン留め日時（null = ピンなし）
}

export interface TravelData {
  [locationId: string]: TravelRecord[];
}
