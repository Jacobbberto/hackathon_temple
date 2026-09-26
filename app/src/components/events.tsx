import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { PulseEvent } from '@/api/types';
import { Brand, CategoryStyle, Fonts, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { cheer } from '@/lib/haptics';
import { usePalette } from '@/lib/theme';
import { daysBetween, formatDay, formatTime, phillyDay, relativeDay } from '@/lib/time';
import { useFx } from './fx';
import { Bouncy, Card, LinkButton, Tag, Txt } from './ui';

function timeLabel(e: PulseEvent): string {
  if (e.ongoing && e.end) return `Through ${formatDay(e.end)}`;
  if (e.all_day) return e.end ? `All day · thru ${formatDay(e.end)}` : 'All day';
  return e.end ? `${formatTime(e.start)} – ${formatTime(e.end)}` : formatTime(e.start);
}

/** Orange-and-white hazard box for street closures. */
export function ClosureNote({ text }: { text: string }) {
  return (
    <View style={styles.closure}>
      <View style={styles.stripes}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.stripe, { backgroundColor: i % 2 ? '#FFFFFF' : Brand.cone }]} />
        ))}
      </View>
      <View style={{ flex: 1, padding: Spacing.sm }}>
        <Txt variant="label" color="#9A3A00" style={{ fontSize: 10.5 }}>
          🚧 Heads up: street closure
        </Txt>
        <Txt variant="small" color="#4A2100">
          {text}
        </Txt>
      </View>
    </View>
  );
}

export function EventCard({ event, showDate }: { event: PulseEvent; showDate?: boolean }) {
  const p = usePalette();
  const cat = CategoryStyle[event.category] ?? CategoryStyle.civic;
  const [open, setOpen] = useState(false);
  return (
    <Bouncy onPress={() => setOpen((o) => !o)} haptic={false} accessibilityHint="Show details">
      <Card accent={cat.color} style={{ gap: 6 }}>
        <View style={styles.row}>
          <Tag label={`${cat.emoji} ${cat.label}`} color={cat.color} />
          <View style={{ flex: 1 }} />
          <Txt variant="small" muted>
            {event.source}
          </Txt>
        </View>
        <Txt variant="bold" style={{ fontSize: 17, lineHeight: 22 }}>
          {event.title}
        </Txt>
        <Txt variant="small" color={p.accent} style={{ fontFamily: Fonts.bold }}>
          🕒 {showDate ? `${relativeDay(phillyDay(new Date(event.start)))} · ` : ''}
          {timeLabel(event)}
        </Txt>
        {event.location ? (
          <Txt variant="small" muted>
            📍 {event.location}
          </Txt>
        ) : null}
        {event.closure ? <ClosureNote text={event.closure} /> : null}
        {open ? (
          <View style={{ gap: 6, marginTop: 2 }}>
            {event.description ? <Txt variant="small">{event.description}</Txt> : null}
            {event.date_note ? (
              <Txt variant="small" muted style={{ fontStyle: 'italic' }}>
                {event.date_note}
              </Txt>
            ) : null}
            <LinkButton label="Details" url={event.url} color={cat.color} />
          </View>
        ) : (
          <Txt variant="small" muted>
            Tap for details
          </Txt>
        )}
      </Card>
    </Bouncy>
  );
}

/** Compact row for "On the horizon": a big date block and a countdown. */
export function HorizonRow({ event }: { event: PulseEvent }) {
  const p = usePalette();
  const cat = CategoryStyle[event.category] ?? CategoryStyle.civic;
  const day = phillyDay(new Date(event.start));
  const away = daysBetween(phillyDay(), day);
  const [weekday, month, date] = formatDay(day).replace(',', '').split(' ');
  return (
    <View style={[styles.horizon, { borderColor: p.border, backgroundColor: p.card }]}>
      <View style={[styles.dateBlock, { backgroundColor: cat.color }]}>
        <Txt variant="label" color="#FFFFFF" style={{ fontSize: 10 }}>
          {month}
        </Txt>
        <Txt variant="title" color="#FFFFFF" style={{ fontSize: 26, lineHeight: 28 }}>
          {date}
        </Txt>
        <Txt variant="label" color="#FFFFFFCC" style={{ fontSize: 9 }}>
          {weekday}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bold" numberOfLines={2}>
          {cat.emoji} {event.title}
        </Txt>
        <Txt variant="small" muted numberOfLines={1}>
          {event.location}
        </Txt>
        {event.closure ? (
          <Txt variant="small" color={Brand.cone} style={{ fontFamily: Fonts.bold }}>
            🚧 Street closures expected
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt variant="title" style={{ fontSize: 26 }}>
          {away}
        </Txt>
        <Txt variant="label" muted style={{ fontSize: 9 }}>
          {away === 1 ? 'day' : 'days'}
        </Txt>
      </View>
    </View>
  );
}

const STEPS = 72;

/**
 * Empty state: run the 72 Rocky Steps at the Art Museum. Each tap is a step.
 */
export function RockySteps({ message }: { message: string }) {
  const p = usePalette();
  const fx = useFx();
  const [steps, setSteps] = useState(0);
  const [jump] = useState(() => new Animated.Value(0));
  const done = steps >= STEPS;

  const climb = () => {
    if (done) {
      setSteps(0);
      return;
    }
    const next = Math.min(STEPS, steps + 4);
    setSteps(next);
    jump.setValue(0);
    Animated.spring(jump, { toValue: 1, useNativeDriver, speed: 30, bounciness: 14 }).start();
    if (next >= STEPS) {
      cheer();
      fx.confetti([Brand.gold, '#FFFFFF', '#8C6A3F', Brand.blue]);
      fx.toast('YO ADRIAN! 🥊 72 steps, champ.');
    }
  };

  const hop = jump.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -10, 0] });
  const pct = steps / STEPS;
  return (
    <Card style={{ alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl }}>
      <Txt muted style={{ textAlign: 'center' }}>
        {message}
      </Txt>
      <Txt variant="title" style={{ textAlign: 'center' }}>
        {done ? 'You made it to the top!' : 'Run the Rocky Steps while you wait'}
      </Txt>
      <Bouncy onPress={climb} accessibilityLabel="Climb a step" style={styles.stairs}>
        <View style={styles.stairsInner}>
          {Array.from({ length: 9 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 22,
                height: 10 + i * 9,
                backgroundColor: i / 9 < pct ? Brand.gold : p.chip,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          ))}
        </View>
        <Animated.View
          style={[
            styles.runner,
            { left: 4 + pct * 176, bottom: 12 + pct * 72, transform: [{ translateY: hop }] },
          ]}>
          <Txt style={{ fontSize: 26, lineHeight: 32 }}>{done ? '🙌' : '🏃'}</Txt>
        </Animated.View>
      </Bouncy>
      <Txt variant="bold" color={p.accent}>
        {done ? 'Tap to run it again' : `${steps} / ${STEPS} steps · tap to climb`}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  closure: {
    flexDirection: 'row',
    backgroundColor: '#FFE8D6',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FFC9A3',
  },
  stripes: { width: 10 },
  stripe: { flex: 1 },
  horizon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    paddingRight: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dateBlock: { width: 54, alignItems: 'center', borderRadius: Radius.sm, paddingVertical: 6 },
  stairs: { width: 230, height: 120, marginTop: Spacing.sm },
  stairsInner: { position: 'absolute', bottom: 0, left: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  runner: { position: 'absolute' },
});
