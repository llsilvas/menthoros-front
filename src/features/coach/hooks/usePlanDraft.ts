import { useEffect, useState } from 'react';
import type { CoachAthleteRow } from '../types/CoachInbox';

interface UsePlanDraftReturn {
  draftIntensity: string;
  setDraftIntensity: (value: string) => void;
  draftDistance: number;
  setDraftDistance: (value: number) => void;
  draftDuration: number;
  setDraftDuration: (value: number) => void;
}

export function usePlanDraft(selected: CoachAthleteRow | null): UsePlanDraftReturn {
  const [draftIntensity, setDraftIntensity] = useState('Z2');
  const [draftDistance, setDraftDistance] = useState(28);
  const [draftDuration, setDraftDuration] = useState(160);

  useEffect(() => {
    if (!selected) return;
    setDraftIntensity(selected.nextWorkout.zone);
    setDraftDistance(Number.parseInt(selected.nextWorkout.title.match(/(\d+)/)?.[1] ?? '28', 10));
    setDraftDuration(
      Math.max(45, Math.round(
        selected.nextWorkout.duration === 'Geral' ? 60
        : selected.nextWorkout.duration.includes('h') ? 160
        : 60,
      )),
    );
  }, [selected]);

  return { draftIntensity, setDraftIntensity, draftDistance, setDraftDistance, draftDuration, setDraftDuration };
}
