import { useState, useCallback } from 'react';
import type { TravelData, TravelRecord, RecordType } from '../../../types';

const STORAGE_KEY = 'travel_stamp_world_v1';

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

export function useWorldTravel() {
  const [data, setData] = useState<TravelData>(load);

  const addRecord = useCallback((
    countryId: string,
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
        [countryId]: [...(prev[countryId] ?? []), record],
      };
      persist(next);
      return next;
    });
  }, []);

  const getRecords = useCallback((countryId: string): TravelRecord[] => {
    return data[countryId] ?? [];
  }, [data]);

  const isVisited = useCallback((countryId: string): boolean => {
    return (data[countryId]?.length ?? 0) > 0;
  }, [data]);

  const visitedCount = Object.values(data).filter(r => r.length > 0).length;

  return { addRecord, getRecords, isVisited, visitedCount };
}
