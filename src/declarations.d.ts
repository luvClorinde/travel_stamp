// 型宣言ファイル（サードパーティ型補完用）
export {};

declare module '@svg-maps/japan' {
  interface Location {
    id: string;
    name: string;
    path: string;
  }
  interface JapanMap {
    label: string;
    viewBox: string;
    locations: Location[];
  }
  const japanMap: JapanMap;
  export default japanMap;
}
