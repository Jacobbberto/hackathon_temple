import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useEvents } from '@/api/hooks';
import type { EventCategory, PulseEvent } from '@/api/types';
import { EventCard, HorizonRow, RockySteps } from '@/components/events';
import { ErrorState, LoadingJawn, PageHeader, Screen } from '@/components/Screen';
import { Chip, SectionTitle, Txt } from '@/components/ui';
import { Brand, CategoryStyle, Spacing } from '@/constants/theme';
import { usePalette } from '@/lib/theme';
import { formatDay, formatLongWeekday, phillyDay, relativeDay } from '@/lib/time';

type Filter = EventCategory | 'all';

/** "Today", "Tomorrow", then "Wednesday". */
const dayName = (day: string, today: string) => {
  const rel = relativeDay(day, today);
  return rel === 'Today' || rel === 'Tomorrow' ? rel : formatLongWeekday(day);
};

export default function EventsScreen() {
  const p = usePalette();
  const { data, isPending, isError, error, refetch, isRefetching } = useEvents();
  const [filter, setFilter] = useState<Filter>('all');

  const matches = (e: PulseEvent) => filter === 'all' || e.category === filter;
  const days = (data?.days ?? [])
    .map((d) => ({ ...d, events: d.events.filter(matches) }))
    .filter((d) => d.events.length);
  const later = (data?.later ?? []).filter(matches);
  const count = (key: Filter) =>
    (data?.days ?? []).reduce((n, d) => n + d.events.filter((e) => key === 'all' || e.category === key).length, 0);
  const today = phillyDay();

  return (
    <Screen
      header={
        <PageHeader
          title="Events"
          tagline="What’s the jawn this week?"
          sources={data?.sources}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
        />
      }
      refreshing={isRefetching}
      onRefresh={() => refetch()}>
      {isPending ? (
        <LoadingJawn />
      ) : isError || !data ? (
        <ErrorState message={error?.message ?? 'Something went sideways.'} onRetry={() => refetch()} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label={`All · ${count('all')}`} active={filter === 'all'} onPress={() => setFilter('all')} emoji="🔔" />
            {data.categories.map((c) => (
              <Chip
                key={c.key}
                label={`${c.label} · ${count(c.key)}`}
                emoji={CategoryStyle[c.key]?.emoji}
                color={CategoryStyle[c.key]?.color}
                active={filter === c.key}
                onPress={() => setFilter(filter === c.key ? 'all' : c.key)}
              />
            ))}
          </ScrollView>

          {days.length === 0 ? (
            <View style={{ marginTop: Spacing.lg }}>
              <RockySteps message="Nothing in this category this week." />
            </View>
          ) : (
            days.map((day) => (
              <View key={day.date}>
                <View style={styles.dayHeader}>
                  <Txt variant="title" color={day.date === today ? Brand.cone : p.text}>
                    {dayName(day.date, today)}
                  </Txt>
                  <Txt variant="label" muted>
                    {formatDay(day.date).split(', ')[1]} · {day.events.length}{' '}
                    {day.events.length === 1 ? 'thing' : 'things'}
                  </Txt>
                </View>
                <View style={{ gap: Spacing.md }}>
                  {day.events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </View>
              </View>
            ))
          )}

          {later.length ? (
            <>
              <SectionTitle kicker="Mark your calendar" title="On the horizon" />
              <View style={{ gap: Spacing.sm }}>
                {later.map((e) => (
                  <HorizonRow key={e.id} event={e} />
                ))}
              </View>
            </>
          ) : null}

          {data.sources.shows?.status === 'off' ? (
            <Txt variant="small" muted style={{ marginTop: Spacing.lg }}>
              🎸 Concert listings are off: {data.sources.shows.note}.
            </Txt>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.sm, paddingVertical: Spacing.lg, paddingRight: Spacing.lg },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
