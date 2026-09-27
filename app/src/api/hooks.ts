import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { getJson } from './client';
import type { EventsResponse, HomeResponse, PoliticsResponse, SportsResponse } from './types';

const MINUTE = 60_000;

export function useHome() {
  const focused = useIsFocused();
  return useQuery({
    queryKey: ['home'],
    queryFn: () => getJson<HomeResponse>('/home'),
    staleTime: MINUTE,
    // Live games tick every minute; otherwise a lazy 5-minute refresh is plenty.
    refetchInterval: (query) =>
      !focused ? false : query.state.data?.sports_today.some((g) => g.state === 'in') ? MINUTE : 5 * MINUTE,
  });
}

export function useSports() {
  const focused = useIsFocused();
  return useQuery({
    queryKey: ['sports'],
    queryFn: () => getJson<SportsResponse>('/sports'),
    staleTime: 30_000,
    refetchInterval: focused ? MINUTE : false,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => getJson<EventsResponse>('/events'),
    staleTime: 10 * MINUTE,
    refetchInterval: 30 * MINUTE,
  });
}

export function usePolitics() {
  return useQuery({
    queryKey: ['politics'],
    queryFn: () => getJson<PoliticsResponse>('/politics'),
    staleTime: 10 * MINUTE,
    refetchInterval: 30 * MINUTE,
  });
}
