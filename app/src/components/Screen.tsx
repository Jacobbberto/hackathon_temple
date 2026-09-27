import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import type { Sources } from '@/api/types';
import { LOADING_LINES } from '@/constants/philly';
import { Brand, MaxContentWidth, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { usePalette } from '@/lib/theme';
import { useFx } from './fx';
import { Bouncy, Txt } from './ui';

type ScreenProps = {
  header: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Scrollable page with pull-to-refresh, a full-bleed header and a centered content column. */
export function Screen({ header, children, refreshing = false, onRefresh }: ScreenProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.background }}
      contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.gold}
            colors={[Brand.blue, Brand.gold]}
            title="Refreshin’ the jawn…"
            titleColor={p.textMuted}
            progressViewOffset={insets.top}
          />
        ) : undefined
      }>
      {header}
      <View style={styles.column}>{children}</View>
    </ScrollView>
  );
}

type PageHeaderProps = {
  title: string;
  tagline: string;
  color?: string;
  sources?: Sources;
  onRefresh?: () => void;
  refreshing?: boolean;
  right?: ReactNode;
};

/** Page header: a Philly-blue band with a skyline silhouette running along the bottom. */
export function PageHeader({ title, tagline, color = Brand.blue, sources, onRefresh, refreshing, right }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageHeader, { backgroundColor: color, paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.pageHeaderInner}>
        <View style={{ flex: 1 }}>
          <Txt variant="display" color="#FFFFFF" style={{ fontSize: 48, lineHeight: 50 }}>
            {title}
          </Txt>
          <Txt variant="bold" color={Brand.goldSoft}>
            {tagline}
          </Txt>
          <View style={styles.headerMeta}>
            <DataStatus sources={sources} onDark />
            {Platform.OS === 'web' && onRefresh ? <RefreshButton onPress={onRefresh} spinning={refreshing} /> : null}
          </View>
        </View>
        {right}
      </View>
      <SkylineStrip />
    </View>
  );
}

function SkylineStrip() {
  return (
    <View style={styles.strip}>
      <Svg width="100%" height="100%" viewBox="0 0 400 40" preserveAspectRatio="xMidYMax slice">
        <Path
          d="M0 40V30h10v-6h12v6h8v-8h14v8h10V20h6v-4h4v4h6v10h8v-6h10v6h10V14l3-6 3 6v16h6V4l2-3 2 3v26h8V18h4l2-6 2 6h4v12h10V26h14v4h10v-8h12v8h8V12l10-4v22h6V2h14v28h6V16h12v14h12v-6h10v6h14v-4h10v4h12v-8h14v8h8v-6h12v6h10v10Z"
          fill="#0E1A2B"
          opacity={0.35}
        />
      </Svg>
    </View>
  );
}

export function RefreshButton({ onPress, spinning }: { onPress: () => void; spinning?: boolean }) {
  return (
    <Bouncy onPress={onPress} accessibilityLabel="Refresh" style={styles.refresh}>
      <Txt variant="bold" color="#FFFFFF" style={{ fontSize: 12 }}>
        {spinning ? 'Refreshin’…' : '↻ Refresh'}
      </Txt>
    </Bouncy>
  );
}

/** "Demo data" / "Saved data" pill when a source isn't live. Tap for the why. */
export function DataStatus({ sources, onDark }: { sources?: Sources; onDark?: boolean }) {
  const fx = useFx();
  if (!sources) return null;
  const metas = Object.values(sources);
  const sample = metas.find((m) => m.status === 'sample');
  const cached = metas.find((m) => m.status === 'cached');
  const meta = sample ?? cached;
  if (!meta) return null;
  const label = sample ? 'Demo data' : 'Saved data';
  return (
    <Bouncy
      onPress={() => fx.toast(meta.note ?? (sample ? 'Live sources are unreachable, so this is sample data.' : 'Showing the last good update.'))}
      style={[styles.status, { backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : Brand.goldSoft }]}>
      <Txt variant="label" color={onDark ? '#FFFFFF' : Brand.ink} style={{ fontSize: 10 }}>
        {sample ? '🧪 ' : '💾 '}
        {label}
      </Txt>
    </Bouncy>
  );
}

/** Loading state: a bouncing cheesesteak and some local color. */
export function LoadingJawn() {
  const p = usePalette();
  const [bounce] = useState(() => new Animated.Value(0));
  const [line, setLine] = useState(() => Math.floor(Math.random() * LOADING_LINES.length));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(bounce, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver }),
      ]),
    );
    loop.start();
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1800);
    return () => {
      loop.stop();
      clearInterval(t);
    };
  }, [bounce]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const rotate = bounce.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  return (
    <View style={styles.loading} accessibilityLabel="Loading">
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <Cheesesteak />
      </Animated.View>
      <Txt variant="bold" muted style={{ textAlign: 'center', marginTop: Spacing.md }}>
        {LOADING_LINES[line]}
      </Txt>
      <View style={[styles.shadow, { backgroundColor: p.border }]} />
    </View>
  );
}

function Cheesesteak() {
  return (
    <Svg width={120} height={60} viewBox="0 0 120 60">
      <Ellipse cx={60} cy={38} rx={56} ry={18} fill="#D99A4E" />
      <G>
        <Path d="M12 32c10-12 86-12 96 0-8 6-88 6-96 0Z" fill="#6B3A1F" />
        <Path d="M16 30c8 6 20-4 30 2s18-6 28 0 20-4 30 0" stroke="#FFC933" strokeWidth={6} strokeLinecap="round" fill="none" />
        <Rect x={30} y={24} width={6} height={3} rx={1.5} fill="#8BC34A" />
        <Rect x={70} y={23} width={7} height={3} rx={1.5} fill="#F2E7D0" />
      </G>
      <Path d="M8 34c6-14 98-14 104 0" stroke="#E8B06B" strokeWidth={5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.loading}>
      <Txt style={{ fontSize: 56, lineHeight: 66 }}>🏖️</Txt>
      <Txt variant="title" style={{ textAlign: 'center' }}>
        The backend went down the shore.
      </Txt>
      <Txt muted style={{ textAlign: 'center', marginTop: Spacing.sm }}>
        {message}
      </Txt>
      <View style={styles.howTo}>
        <Txt variant="label" muted>
          Start it in another terminal
        </Txt>
        <Txt variant="small" style={styles.code}>
          cd backend{'\n'}source .venv/bin/activate{'\n'}uvicorn main:app --reload --host 0.0.0.0
        </Txt>
        <Txt variant="small" muted>
          First time? Run the setup steps in the README. Deployed backend? Set EXPO_PUBLIC_API_URL.
        </Txt>
      </View>
      <Bouncy onPress={onRetry} style={styles.retry}>
        <Txt variant="bold" color="#FFFFFF">
          Try again, bol
        </Txt>
      </Bouncy>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pageHeader: { paddingBottom: 34, overflow: 'hidden' },
  pageHeaderInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, pointerEvents: 'none' },
  refresh: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  status: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  loading: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: Spacing.xl, gap: Spacing.xs },
  shadow: { width: 80, height: 6, borderRadius: 3, marginTop: Spacing.md, opacity: 0.8 },
  howTo: { alignSelf: 'stretch', gap: 6, marginTop: Spacing.md, alignItems: 'center' },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    backgroundColor: Brand.ink,
    color: Brand.goldSoft,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    lineHeight: 20,
  },
  retry: {
    marginTop: Spacing.lg,
    backgroundColor: Brand.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Brand.gold,
  },
});
