import { useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { Bill, Election, Hearing } from '@/api/types';
import { Brand, Fonts, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { CIVICS_FACTS, PHILLY_HISTORY } from '@/constants/history';
import { thump } from '@/lib/haptics';
import { animateNextLayout } from '@/lib/layout';
import { openLink } from '@/lib/links';
import { usePalette } from '@/lib/theme';
import { formatDay, formatTime, phillyDay, relativeDay } from '@/lib/time';
import { useFx } from './fx';
import { LibertyBell } from './icons';
import { Bouncy, Card, Chevron, LinkButton, Tag, Txt } from './ui';

export function ElectionCountdown({ election }: { election: Election }) {
  const fx = useFx();
  const [swing] = useState(() => new Animated.Value(0));
  const [rings, setRings] = useState(0);

  const ring = () => {
    thump();
    swing.setValue(0);
    Animated.timing(swing, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver }).start();
    const next = rings + 1;
    setRings(next);
    fx.toast(
      next % 5 === 0
        ? 'Easy there. The real one cracked in the 1840s. 🔔'
        : `Let freedom ring! ${election.days_until} days to ${election.name}.`,
    );
  };

  const rotate = swing.interpolate({
    inputRange: [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1],
    outputRange: ['0deg', '-18deg', '14deg', '-9deg', '5deg', '-2deg', '0deg'],
  });

  const today = election.days_until === 0;
  return (
    <View style={[styles.countdown, { backgroundColor: Brand.blue }]}>
      <View style={styles.countdownRow}>
        <Bouncy onPress={ring} haptic={false} accessibilityLabel="Ring the Liberty Bell">
          <Animated.View style={{ transform: [{ translateY: -30 }, { rotate }, { translateY: 30 }] }}>
            <LibertyBell size={104} />
          </Animated.View>
        </Bouncy>
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={Brand.goldSoft}>
            {election.name} · {formatDay(election.date)}
          </Txt>
          {today ? (
            <Txt style={styles.bigNumber}>TODAY!</Txt>
          ) : (
            <Txt style={styles.bigNumber}>
              {election.days_until}
              <Txt style={styles.bigUnit}> {election.days_until === 1 ? 'day' : 'days'}</Txt>
            </Txt>
          )}
          <Txt variant="small" color="#FFFFFFCC">
            {today ? 'Polls are open 7 a.m. to 8 p.m.' : 'Tap the bell. Then make a plan to vote.'}
          </Txt>
        </View>
      </View>

      <View style={styles.timeline}>
        {election.key_dates.map((k, i) => (
          <View key={k.label} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineDot, { backgroundColor: k.passed ? '#FFFFFF55' : Brand.gold }]}>
                <Txt variant="label" color={Brand.ink} style={{ fontSize: 10 }}>
                  {k.passed ? '✓' : i + 1}
                </Txt>
              </View>
              {i < election.key_dates.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: Spacing.md }}>
              <Txt variant="bold" color={k.passed ? '#FFFFFF88' : '#FFFFFF'}>
                {k.label}
              </Txt>
              <Txt variant="small" color="#FFFFFFBB">
                {formatDay(k.date)} · {k.passed ? 'passed' : k.days_until === 0 ? 'today!' : `in ${k.days_until} days`}
              </Txt>
              <Txt variant="small" color="#FFFFFF99">
                {k.note}
              </Txt>
            </View>
          </View>
        ))}
      </View>

      {election.note ? (
        <Txt variant="small" color={Brand.goldSoft} style={{ marginBottom: Spacing.sm }}>
          ℹ️ {election.note}
        </Txt>
      ) : null}

      <View style={styles.linkGrid}>
        {election.links.map((l, i) => (
          <Bouncy
            key={l.url}
            onPress={() => openLink(l.url)}
            accessibilityRole="link"
            style={[styles.voteLink, i === 0 ? { backgroundColor: Brand.gold } : { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <Txt variant="bold" color={i === 0 ? Brand.ink : '#FFFFFF'} style={{ fontSize: 13 }}>
              {i === 0 ? '📍 ' : ''}
              {l.label} ↗
            </Txt>
          </Bouncy>
        ))}
      </View>
      <Txt variant="small" color="#FFFFFF88" style={{ marginTop: Spacing.sm }}>
        Dates follow Pennsylvania election law. Always confirm with the official links.
      </Txt>
    </View>
  );
}

export function HearingCard({ hearing }: { hearing: Hearing }) {
  const p = usePalette();
  const session = hearing.kind === 'Session';
  const day = phillyDay(new Date(hearing.start));
  return (
    <Card accent={session ? Brand.gold : Brand.blue} style={{ gap: 6 }}>
      <View style={styles.row}>
        <Tag label={session ? '🏛️ Council session' : '🎤 Committee hearing'} color={session ? '#B07F00' : p.accent} />
        <View style={{ flex: 1 }} />
        <Txt variant="bold" color={p.accent} style={{ fontSize: 13 }}>
          {relativeDay(day)}
          {hearing.time_tbd ? '' : ` · ${formatTime(hearing.start)}`}
        </Txt>
      </View>
      <Txt variant="bold" style={{ fontSize: 16 }}>
        {hearing.title}
      </Txt>
      {hearing.details ? (
        <Txt variant="small" muted numberOfLines={3}>
          {hearing.details}
        </Txt>
      ) : null}
      <Txt variant="small" muted>
        📍 {hearing.location}
      </Txt>
      <View style={styles.wrapRow}>
        <LinkButton label="Meeting page" url={hearing.url} />
        <LinkButton label="Agenda" url={hearing.agenda_url} />
      </View>
    </Card>
  );
}

export function BillCard({ bill }: { bill: Bill }) {
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const passed = bill.stage === 'Passed';
  const date = passed ? bill.passed : bill.introduced;
  return (
    <Card style={{ gap: 8 }}>
      <View style={styles.row}>
        <Txt variant="label" muted>
          {bill.source === 'City Council' ? '🏛️' : '🏢'} {bill.type} {bill.number}
        </Txt>
        <View style={{ flex: 1 }} />
        <Tag label={passed ? 'Passed' : 'Introduced'} color={passed ? '#0E9F6E' : '#B07F00'} solid={passed} />
      </View>
      <Txt variant="bold" style={{ fontSize: 16.5, lineHeight: 23 }}>
        {bill.summary}
      </Txt>
      <Txt variant="small" muted>
        {bill.source}
        {date ? ` · ${passed ? 'passed' : 'introduced'} ${formatDay(date)}` : ''}
        {bill.status && bill.status !== bill.stage ? ` · ${bill.status}` : ''}
      </Txt>
      {open ? (
        <View style={[styles.fullTitle, { backgroundColor: p.cardAlt }]}>
          <Txt variant="label" muted style={{ marginBottom: 4 }}>
            Official title
          </Txt>
          <Txt variant="small">{bill.title}</Txt>
        </View>
      ) : null}
      <View style={styles.wrapRow}>
        <Bouncy onPress={() => setOpen((o) => !o)} style={[styles.ghost, { borderColor: p.border }]}>
          <Txt variant="bold" style={{ fontSize: 13 }}>
            {open ? 'Hide legalese' : 'Show the legalese'}
          </Txt>
        </Bouncy>
        <LinkButton label="Official text" url={bill.url} />
      </View>
    </Card>
  );
}

/** "Philly History 101": a collapsible timeline at the bottom of the Politics tab. */
export function PhillyHistory() {
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const toggle = () => {
    animateNextLayout();
    setOpen((o) => !o);
  };
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Bouncy
        onPress={toggle}
        haptic
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Philly History 101"
        style={[styles.historyHeader, { backgroundColor: p.cardAlt }]}>
        <Txt style={{ fontSize: 30, lineHeight: 36 }}>📜</Txt>
        <View style={{ flex: 1 }}>
          <Txt variant="title" style={{ fontSize: 24, lineHeight: 26 }}>
            Philly History 101
          </Txt>
          <Txt variant="small" muted>
            {open
              ? 'From Penn’s grid to the Philly Special.'
              : `${PHILLY_HISTORY.length} moments from Penn’s grid to the Philly Special. Tap to open.`}
          </Txt>
        </View>
        <Chevron open={open} color={p.accent} />
      </Bouncy>

      {open ? (
        <View style={{ padding: Spacing.lg, paddingTop: Spacing.md }}>
          {PHILLY_HISTORY.map((entry, i) => (
            <View key={entry.year} style={styles.historyRow}>
              <View style={styles.historyRail}>
                <View style={styles.yearBadge}>
                  <Txt variant="label" color={Brand.ink} style={{ fontSize: 10.5, letterSpacing: 0.5 }}>
                    {entry.year}
                  </Txt>
                </View>
                {i < PHILLY_HISTORY.length - 1 ? <View style={[styles.historyLine, { backgroundColor: p.border }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: Spacing.lg, gap: 2 }}>
                <Txt variant="bold">
                  {entry.emoji} {entry.title}
                </Txt>
                <Txt variant="small" muted>
                  {entry.text}
                </Txt>
              </View>
            </View>
          ))}

          <View style={[styles.civics, { backgroundColor: p.cardAlt }]}>
            <Txt variant="label" color={p.accent}>
              How City Hall works
            </Txt>
            {CIVICS_FACTS.map((fact) => (
              <Txt key={fact} variant="small">
                • {fact}
              </Txt>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  countdown: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 3, borderColor: Brand.gold, overflow: 'hidden' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigNumber: { fontFamily: Fonts.display, fontSize: 72, lineHeight: 74, color: '#FFFFFF' },
  bigUnit: { fontFamily: Fonts.display, fontSize: 30, color: Brand.gold },
  timeline: { marginTop: Spacing.lg },
  timelineRow: { flexDirection: 'row', gap: Spacing.md },
  timelineRail: { alignItems: 'center', width: 22 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#FFFFFF33', marginVertical: 2 },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  voteLink: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill },
  fullTitle: { borderRadius: Radius.sm, padding: Spacing.md },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  historyRow: { flexDirection: 'row', gap: Spacing.md },
  historyRail: { alignItems: 'center', width: 78 },
  yearBadge: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: 'center',
  },
  historyLine: { flex: 1, width: 2, marginVertical: 3 },
  civics: { borderRadius: Radius.md, padding: Spacing.md, gap: 6 },
  ghost: { borderWidth: 1.5, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
});
