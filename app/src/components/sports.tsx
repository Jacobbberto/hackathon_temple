import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';

import type { Game, Team } from '@/api/types';
import { Brand, Fonts, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { openLink } from '@/lib/links';
import { usePalette } from '@/lib/theme';
import { gameTimeLabel, phillyDay, relativeDay } from '@/lib/time';
import { useFx } from './fx';
import { Bouncy, Card, LinkButton, Tag, Txt } from './ui';

export const TEAM_COLORS: Record<string, [string, string]> = {
  eagles: ['#004C54', '#A5ACAF'],
  phillies: ['#E81828', '#002D72'],
  sixers: ['#006BB6', '#ED174C'],
  flyers: ['#F74902', '#111111'],
  union: ['#071B2C', '#B19B69'],
  temple: ['#9D2235', '#FFFFFF'],
};

const TEAM_EMOJI: Record<string, string> = {
  eagles: '🦅',
  phillies: '⚾',
  sixers: '🏀',
  flyers: '🏒',
  union: '⚽',
  temple: '🦉',
};

export const teamColor = (key: string) => TEAM_COLORS[key]?.[0] ?? Brand.blue;

/** The pulsing red LIVE pill. */
export function LiveBadge({ label = 'LIVE' }: { label?: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  return (
    <View style={styles.live} accessibilityLabel="Live now">
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <View style={styles.dot} />
      </View>
      <Txt variant="label" color="#FFFFFF" style={{ fontSize: 11 }}>
        {label}
      </Txt>
    </View>
  );
}

function ResultBadge({ result }: { result: Game['result'] }) {
  if (!result) return null;
  const color = result === 'W' ? '#0E9F6E' : result === 'L' ? '#9CA3AF' : Brand.gold;
  return <Tag label={result === 'W' ? 'W' : result === 'L' ? 'L' : 'T'} color={color} solid />;
}

/** Compact card for the Home "Today in Philly" strip. */
export function MiniGame({ game, onPress }: { game: Game; onPress?: () => void }) {
  const p = usePalette();
  const color = teamColor(game.team);
  const showScore = game.state !== 'pre';
  return (
    <Bouncy onPress={onPress} style={[styles.mini, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={[styles.miniBand, { backgroundColor: color }]}>
        <Txt variant="label" color="#FFFFFF" style={{ fontSize: 10.5 }}>
          {TEAM_EMOJI[game.team]} {game.team_name}
        </Txt>
        {game.state === 'in' ? <LiveBadge /> : <Txt variant="label" color="#FFFFFFCC" style={{ fontSize: 10 }}>{game.league}</Txt>}
      </View>
      <View style={{ padding: Spacing.md, gap: 2 }}>
        <Txt variant="small" muted numberOfLines={1}>
          {game.is_home ? 'vs' : '@'} {game.opponent.short_name}
        </Txt>
        {showScore ? (
          <Txt variant="title" style={{ fontSize: 30, lineHeight: 32 }}>
            {game.team_score ?? '-'}
            <Txt variant="title" muted style={{ fontSize: 22 }}>
              {'  '}
              {game.opponent_score ?? '-'}
            </Txt>
          </Txt>
        ) : (
          <Txt variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
            {gameTimeLabel(game.start_time).split(' · ')[1]}
          </Txt>
        )}
        <Txt variant="small" muted numberOfLines={1}>
          {game.state === 'pre' ? (game.broadcasts[0]?.name ?? 'TBA') : game.detail}
        </Txt>
      </View>
    </Bouncy>
  );
}

/** Full game card for the Sports tab. */
export function GameCard({ game }: { game: Game }) {
  const p = usePalette();
  const primary = teamColor(game.team);
  const live = game.state === 'in';
  const final = game.state === 'post';
  return (
    <Card accent={primary} style={{ gap: Spacing.sm }}>
      <View style={styles.row}>
        <Tag label={`${TEAM_EMOJI[game.team] ?? ''} ${game.team_name} · ${game.league}`} color={primary} />
        <View style={{ flex: 1 }} />
        {live ? <LiveBadge /> : null}
        {final ? <ResultBadge result={game.result} /> : null}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Txt variant="small" muted>
            {game.is_home ? 'vs' : 'at'}
          </Txt>
          <Txt variant="title" style={{ fontSize: 26 }} numberOfLines={1}>
            {game.opponent.name}
          </Txt>
        </View>
        {game.state === 'pre' ? null : (
          <View style={styles.scoreBox}>
            <Txt style={[styles.score, { color: p.text }]}>{game.team_score ?? '–'}</Txt>
            <Txt style={[styles.score, { color: p.textMuted, fontSize: 30 }]}>–</Txt>
            <Txt style={[styles.score, { color: p.textMuted }]}>{game.opponent_score ?? '–'}</Txt>
          </View>
        )}
      </View>

      <Txt variant="bold" color={live ? Brand.live : p.text}>
        {game.state === 'pre'
          ? gameTimeLabel(game.start_time)
          : game.state === 'post'
            ? `${game.detail || 'Final'} · ${relativeDay(phillyDay(new Date(game.start_time)))}`
            : game.detail}
      </Txt>
      {game.venue ? (
        <Txt variant="small" muted>
          📍 {game.venue}
        </Txt>
      ) : null}

      {game.state !== 'post' && game.broadcasts.length ? (
        <View style={{ gap: 6 }}>
          <Txt variant="label" muted>
            Where to watch{game.broadcast_is_typical ? ' (usually)' : ''}
          </Txt>
          <View style={styles.wrapRow}>
            {game.broadcasts.map((b) => (
              <Bouncy
                key={b.name}
                onPress={() => openLink(b.url)}
                disabled={!b.url}
                style={[styles.tv, { backgroundColor: p.chip, borderColor: p.border }]}>
                <Txt variant="bold" style={{ fontSize: 13 }}>
                  📺 {b.name}
                  {b.url ? ' ↗' : ''}
                </Txt>
              </Bouncy>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.wrapRow}>
        {final ? <LinkButton label="Recap" url={game.recap_url} /> : null}
        {!final ? <LinkButton label="Game center" url={game.game_url} /> : null}
      </View>
    </Card>
  );
}

/** Six pennants. Tap one to filter to that team and lead the crowd in its chant. */
export function TeamPennants({
  teams,
  selected,
  onSelect,
  chant = true,
}: {
  teams: Team[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  chant?: boolean;
}) {
  const fx = useFx();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pennants}>
      {teams.map((team) => {
        const active = selected === team.key;
        const dim = selected !== null && !active;
        return (
          <Bouncy
            key={team.key}
            accessibilityLabel={`${team.full_name}${active ? ', selected' : ''}`}
            onPress={() => {
              if (active) {
                onSelect(null);
                return;
              }
              onSelect(team.key);
              if (chant) fx.chant(team.key, [team.primary, team.secondary]);
            }}
            style={[styles.pennant, { backgroundColor: team.primary, opacity: dim ? 0.45 : 1 }, active && styles.pennantActive]}>
            <Txt style={{ fontSize: 20, lineHeight: 24 }}>{TEAM_EMOJI[team.key]}</Txt>
            <Txt variant="title" color="#FFFFFF" style={{ fontSize: 20, lineHeight: 22 }}>
              {team.name}
            </Txt>
            <View style={[styles.pennantTip, { borderLeftColor: team.primary }]} />
          </Bouncy>
        );
      })}
    </ScrollView>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={[styles.segment, { backgroundColor: p.chip, borderColor: p.border }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Bouncy
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segmentItem, active && { backgroundColor: p.accent }]}>
            <Txt variant="bold" color={active ? p.accentText : p.text} style={{ fontSize: 14 }}>
              {o.label}
              {o.count !== undefined ? ` · ${o.count}` : ''}
            </Txt>
          </Bouncy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  dotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  dotRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  mini: { width: 168, borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  miniBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  score: { fontFamily: Fonts.display, fontSize: 44, lineHeight: 46 },
  tv: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1 },
  pennants: { gap: Spacing.sm, paddingVertical: Spacing.sm, paddingRight: Spacing.lg },
  pennant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 20,
    height: 40,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    marginRight: 12,
  },
  pennantActive: { borderWidth: 2, borderColor: Brand.gold },
  pennantTip: {
    position: 'absolute',
    right: -14,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 14,
    borderTopWidth: 20,
    borderBottomWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  segment: { flexDirection: 'row', borderRadius: Radius.pill, borderWidth: 1, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.pill },
});
