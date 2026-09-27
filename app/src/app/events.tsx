import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useEvents } from '@/api/hooks';
import type { EventCategory, PulseEvent } from '@/api/types';
import { DayPicker, EventCard, EventRow, HorizonRow, RockySteps, isWeekend, type DayChoice } from '@/components/events';
import { ErrorState, LoadingJawn, PageHeader, Screen } from '@/components/Screen';
import { Segmented } from '@/components/sports';
import { Bouncy, Card, Chevron, Chip, SectionTitle, Txt } from '@/components/ui';
import { Brand, CategoryStyle, Spacing } from '@/constants/theme';
import { animateNextLayout } from '@/lib/layout';
import { usePreference } from '@/lib/prefs';
import { usePalette } from '@/lib/theme';
import { dayToDate, formatDay, formatLongWeekday, phillyDay, relativeDay } from '@/lib/time';

type Filter = EventCategory | 'all';
type ViewMode = 'compact' | 'detailed';

/** How many events a day shows before "Show N more". */
const PREVIEW_COUNT = 5;

/** "Today", "Tomorrow", then "Wednesday". */
const dayName = (day: string, today: string) => {
  const rel = relativeDay(day, today);
  return rel === 'Today' || rel === 'Tomorrow' ? rel : formatLongWeekday(day);
};

/** "today", "tomorrow", or "on Thu, Oct 1", for use mid-sentence. */
const dayPhrase = (day: string, today: string) => {
  const rel = relativeDay(day, today);
  return rel === 'Today' || rel === 'Tomorrow' ? rel.toLowerCase() : `on ${rel}`;
};

/** The 7 calendar days the backend covers, e.g. ["2026-09-27", ...]. */
function weekDays(start: string, end: string): string[] {
  const days: string[] = [];
  for (let t = dayToDate(start).getTime(); t <= dayToDate(end).getTime(); t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

export default function EventsScreen() {
  const p = usePalette();
  const { data, isPending, isError, error, refetch, isRefetching } = useEvents();
  const [filter, setFilter] = useState<Filter>('all');
  const [dayChoice, setDayChoice] = useState<DayChoice>('all');
  const [mode, setMode] = usePreference<ViewMode>('eventsView', 'compact');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState<Set<string>>(() => new Set());

  const today = phillyDay();
  const matches = (e: PulseEvent) => filter === 'all' || e.category === filter;
  const byCategory = (data?.days ?? []).map((d) => ({ ...d, events: d.events.filter(matches) }));
  const counts = Object.fromEntries(byCategory.map((d) => [d.date, d.events.length]));
  const inDayChoice = (day: string) =>
    dayChoice === 'all' || (dayChoice === 'weekend' ? isWeekend(day) : day === dayChoice);
  const days = byCategory.filter((d) => d.events.length && inDayChoice(d.date));
  const later = dayChoice === 'all' ? (data?.later ?? []).filter(matches) : [];
  const categoryCount = (key: Filter) =>
    (data?.days ?? []).reduce((n, d) => n + d.events.filter((e) => key === 'all' || e.category === key).length, 0);
  const allCollapsed = days.length > 0 && days.every((d) => collapsed.has(d.date));

  const toggleIn = (set: Set<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  const emptyMessage =
    dayChoice === 'all'
      ? 'Nothing in this category this week.'
      : dayChoice === 'weekend'
        ? 'Nothing on the calendar this weekend.'
        : `Nothing on the calendar ${dayPhrase(dayChoice, today)}.`;

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
            <Chip label={`All · ${categoryCount('all')}`} active={filter === 'all'} onPress={() => setFilter('all')} emoji="🔔" />
            {data.categories.map((c) => (
              <Chip
                key={c.key}
                label={`${c.label} · ${categoryCount(c.key)}`}
                emoji={CategoryStyle[c.key]?.emoji}
                color={CategoryStyle[c.key]?.color}
                active={filter === c.key}
                onPress={() => setFilter(filter === c.key ? 'all' : c.key)}
              />
            ))}
          </ScrollView>

          <DayPicker
            days={weekDays(data.range.start, data.range.end)}
            counts={counts}
            today={today}
            value={dayChoice}
            onChange={setDayChoice}
          />

          <View style={styles.viewBar}>
            <View style={{ flex: 1 }}>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { key: 'compact', label: '☰ Compact' },
                  { key: 'detailed', label: '▤ Detailed' },
                ]}
              />
            </View>
            {days.length > 1 ? (
              <Bouncy
                accessibilityRole="button"
                onPress={() => {
                  animateNextLayout();
                  setCollapsed(allCollapsed ? new Set() : new Set(days.map((d) => d.date)));
                }}
                style={[styles.collapseAll, { borderColor: p.border }]}>
                <Txt variant="bold" style={{ fontSize: 12.5 }} color={p.accent}>
                  {allCollapsed ? 'Expand all' : 'Collapse all'}
                </Txt>
              </Bouncy>
            ) : null}
          </View>

          {days.length === 0 ? (
            <View style={{ marginTop: Spacing.md }}>
              <RockySteps message={emptyMessage} />
            </View>
          ) : (
            days.map((day) => {
              const isCollapsed = collapsed.has(day.date);
              const expanded = showAll.has(day.date);
              const visible = expanded ? day.events : day.events.slice(0, PREVIEW_COUNT);
              const hidden = day.events.length - visible.length;
              return (
                <View key={day.date}>
                  <Bouncy
                    haptic={false}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: !isCollapsed }}
                    onPress={() => {
                      animateNextLayout();
                      setCollapsed((c) => toggleIn(c, day.date));
                    }}
                    style={styles.dayHeader}>
                    <Txt variant="title" color={day.date === today ? Brand.cone : p.text}>
                      {dayName(day.date, today)}
                    </Txt>
                    <Txt variant="label" muted style={{ flex: 1 }}>
                      {formatDay(day.date).split(', ')[1]} · {day.events.length}{' '}
                      {day.events.length === 1 ? 'thing' : 'things'}
                    </Txt>
                    <Chevron open={!isCollapsed} color={p.accent} />
                  </Bouncy>

                  {isCollapsed ? null : (
                    <>
                      {mode === 'compact' ? (
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                          {visible.map((e, i) => (
                            <EventRow key={e.id} event={e} last={i === visible.length - 1} />
                          ))}
                        </Card>
                      ) : (
                        <View style={{ gap: Spacing.md }}>
                          {visible.map((e) => (
                            <EventCard key={e.id} event={e} />
                          ))}
                        </View>
                      )}
                      {day.events.length > PREVIEW_COUNT ? (
                        <Bouncy
                          accessibilityRole="button"
                          onPress={() => {
                            animateNextLayout();
                            setShowAll((s) => toggleIn(s, day.date));
                          }}
                          style={[styles.moreButton, { borderColor: p.border, backgroundColor: p.card }]}>
                          <Txt variant="bold" color={p.accent} style={{ fontSize: 13.5 }}>
                            {expanded ? 'Show fewer' : `Show ${hidden} more`}
                          </Txt>
                        </Bouncy>
                      ) : null}
                    </>
                  )}
                </View>
              );
            })
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
  chips: { gap: Spacing.sm, paddingTop: Spacing.lg, paddingBottom: Spacing.md, paddingRight: Spacing.lg },
  viewBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  collapseAll: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  moreButton: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
