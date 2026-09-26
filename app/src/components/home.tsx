import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { Headline, Weather } from '@/api/types';
import { SLANG, weatherTake, wooderIceIndex } from '@/constants/philly';
import { Brand, Fonts, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { openLink } from '@/lib/links';
import { usePalette } from '@/lib/theme';
import { formatWeekday, timeAgo } from '@/lib/time';
import { WeatherIcon } from './icons';
import { Bouncy, Card, Txt } from './ui';

const round = (n: number | null | undefined) => (n === null || n === undefined ? '–' : Math.round(n));

export function WeatherCard({ weather }: { weather: Weather }) {
  const p = usePalette();
  const cups = wooderIceIndex(weather.high_f ?? weather.temp_f);
  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={styles.row}>
        <WeatherIcon icon={weather.icon} night={!weather.is_day} size={76} />
        <View style={{ flex: 1 }}>
          <Txt style={styles.temp}>{round(weather.temp_f)}°</Txt>
          <Txt variant="bold">{weather.condition}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Txt variant="bold">
            H {round(weather.high_f)}° · L {round(weather.low_f)}°
          </Txt>
          <Txt variant="small" muted>
            Feels like {round(weather.feels_like_f)}°
          </Txt>
          {weather.precip_chance !== null ? (
            <Txt variant="small" muted>
              💧 {weather.precip_chance}% rain
            </Txt>
          ) : null}
        </View>
      </View>

      <View style={[styles.bubble, { backgroundColor: p.cardAlt }]}>
        <Txt variant="bold" style={{ fontSize: 14 }}>
          “{weatherTake(weather.icon, weather.temp_f)}”
        </Txt>
        <Txt variant="small" muted style={{ marginTop: 4 }}>
          Wooder ice index: {cups ? '🍧'.repeat(cups) : 'hot chocolate season ☕'}
        </Txt>
      </View>

      <View style={styles.outlook}>
        {weather.outlook.map((d) => (
          <View key={d.date} style={[styles.day, { borderColor: p.border }]}>
            <Txt variant="label" muted>
              {formatWeekday(d.date)}
            </Txt>
            <WeatherIcon icon={d.icon} size={38} />
            <Txt variant="bold" style={{ fontSize: 14 }}>
              {round(d.high_f)}°{' '}
              <Txt variant="small" muted>
                {round(d.low_f)}°
              </Txt>
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function HeadlineRow({ item, rank }: { item: Headline; rank: number }) {
  const p = usePalette();
  return (
    <Bouncy onPress={() => openLink(item.url)} accessibilityRole="link" style={[styles.headline, { borderColor: p.border }]}>
      <Txt style={[styles.rank, { color: rank <= 3 ? Brand.gold : p.textMuted }]}>{rank}</Txt>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bold" style={{ fontSize: 16, lineHeight: 21 }}>
          {item.title}
        </Txt>
        {item.snippet ? (
          <Txt variant="small" muted numberOfLines={2}>
            {item.snippet}
          </Txt>
        ) : null}
        <Txt variant="label" color={p.accent} style={{ fontSize: 10.5 }}>
          {item.source}
          {item.published_at ? ` · ${timeAgo(item.published_at)}` : ''} ↗
        </Txt>
      </View>
    </Bouncy>
  );
}

/** "Jawn of the Day": a flip card. Tap to flip, then tap "Next jawn" for another. */
export function SlangCard() {
  const p = usePalette();
  // A new word every day; tap "Next jawn" for more.
  const [index, setIndex] = useState(() => Math.floor(Date.now() / 86_400_000) % SLANG.length);
  const [flipped, setFlipped] = useState(false);
  const [spin] = useState(() => new Animated.Value(0));
  const word = SLANG[index];

  const flip = () => {
    Animated.spring(spin, { toValue: flipped ? 0 : 1, useNativeDriver, friction: 7, tension: 60 }).start();
    setFlipped((f) => !f);
  };
  const next = () => {
    setIndex((i) => (i + 1) % SLANG.length);
    if (flipped) flip();
  };

  const frontRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = spin.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = spin.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

  return (
    <View style={{ gap: Spacing.sm }}>
      <Bouncy onPress={flip} accessibilityHint="Flip the card" style={styles.flipWrap}>
        <Animated.View
          style={[styles.face, styles.front, { opacity: frontOpacity, transform: [{ perspective: 800 }, { rotateY: frontRotate }] }]}>
          <Txt variant="label" color={Brand.goldSoft}>
            Say it like a local
          </Txt>
          <Txt style={styles.word}>{word.word}</Txt>
          <Txt variant="bold" color="#FFFFFFCC">
            /{word.say}/
          </Txt>
          <Txt variant="small" color="#FFFFFFAA" style={{ marginTop: 6 }}>
            Tap to flip 🔄
          </Txt>
        </Animated.View>
        <Animated.View
          style={[
            styles.face,
            styles.back,
            { backgroundColor: p.card, borderColor: Brand.gold, opacity: backOpacity, transform: [{ perspective: 800 }, { rotateY: backRotate }] },
          ]}>
          <Txt variant="title" style={{ fontSize: 30 }}>
            {word.word}
          </Txt>
          <Txt style={{ textAlign: 'center' }}>{word.means}</Txt>
          <Txt variant="bold" color={p.accent} style={{ textAlign: 'center', marginTop: 4 }}>
            {word.example}
          </Txt>
        </Animated.View>
      </Bouncy>
      <Bouncy onPress={next} style={[styles.nextJawn, { borderColor: p.accent }]}>
        <Txt variant="bold" color={p.accent}>
          Next jawn →
        </Txt>
      </Bouncy>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  temp: { fontFamily: Fonts.display, fontSize: 64, lineHeight: 64 },
  bubble: { borderRadius: Radius.md, padding: Spacing.md },
  outlook: { flexDirection: 'row', gap: Spacing.sm },
  day: { flex: 1, alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: Radius.md, paddingVertical: Spacing.sm },
  headline: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  rank: { fontFamily: Fonts.display, fontSize: 36, lineHeight: 38, width: 30, textAlign: 'center' },
  flipWrap: { height: 190 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backfaceVisibility: 'hidden',
  },
  front: { backgroundColor: Brand.blue, borderWidth: 3, borderColor: Brand.gold },
  back: { borderWidth: 3, gap: 6 },
  word: { fontFamily: Fonts.display, fontSize: 56, lineHeight: 60, color: '#FFFFFF', letterSpacing: 2 },
  nextJawn: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
