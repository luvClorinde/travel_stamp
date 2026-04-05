import { useState, useCallback } from 'react';
import type { TravelData, TravelRecord, RecordType } from '../../../types';

const STORAGE_KEY = 'travel_stamp_domestic_v1';

function load(): TravelData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(data: TravelData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useTravel() {
  const [data, setData] = useState<TravelData>(load);

  const addRecord = useCallback((
    prefectureId: string,
    type: RecordType,
    content: string,
    caption?: string,
    photos?: string[],
  ) => {
    const record: TravelRecord = {
      id: crypto.randomUUID(),
      type,
      content,
      caption,
      photos,
      createdAt: new Date().toISOString(),
    };
    setData(prev => {
      const next = {
        ...prev,
        [prefectureId]: [...(prev[prefectureId] ?? []), record],
      };
      persist(next);
      return next;
    });
  }, []);

  const getRecords = useCallback((prefectureId: string): TravelRecord[] => {
    return data[prefectureId] ?? [];
  }, [data]);

  const isVisited = useCallback((prefectureId: string): boolean => {
    return (data[prefectureId]?.length ?? 0) > 0;
  }, [data]);

  const visitedCount = Object.values(data).filter(r => r.length > 0).length;

  return { addRecord, getRecords, isVisited, visitedCount };
}
