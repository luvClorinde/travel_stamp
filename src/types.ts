export type RecordType = 'text' | 'image';

export interface TravelRecord {
  id: string;
  type: RecordType;
  content: string;      // テキスト or 後方互換用 base64（画像1枚目）
  caption?: string;
  photos?: string[];    // 複数画像 data URL（imageタイプで使用）
  createdAt: string;
}

export interface TravelData {
  [locationId: string]: TravelRecord[];
}
