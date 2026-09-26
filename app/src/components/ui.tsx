import { useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Fonts, Radius, Spacing, useNativeDriver } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { openLink } from '@/lib/links';
import { usePalette } from '@/lib/theme';

type TxtProps = TextProps & {
  variant?: 'display' | 'title' | 'body' | 'small' | 'label' | 'bold';
  muted?: boolean;
  color?: string;
};

export function Txt({ variant = 'body', muted, color, style, ...rest }: TxtProps) {
  const p = usePalette();
  return (
    <Text
      {...rest}
      style={[styles[variant], { color: color ?? (muted ? p.textMuted : p.text) }, style as StyleProp<TextStyle>]}
    />
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const p = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: p.card, borderColor: p.border, boxShadow: `0px 4px 12px ${p.shadow}` },
        accent ? { borderLeftWidth: 5, borderLeftColor: accent } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, kicker, right }: { title: string; kicker?: string; right?: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.sectionRow}>
      <View style={{ flex: 1 }}>
        {kicker ? (
          <Txt variant="label" color={p.accent}>
            {kicker}
          </Txt>
        ) : null}
        <Txt variant="title">{title}</Txt>
      </View>
      {right}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that squishes a little when you touch it. */
export function Bouncy({
  children,
  style,
  onPress,
  haptic = true,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean; children: ReactNode }) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver, speed: 40, bounciness: 12 }).start();
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={() => to(0.95)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
  emoji,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  emoji?: string;
}) {
  const p = usePalette();
  const bg = active ? (color ?? p.accent) : p.chip;
  return (
    <Bouncy
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, { backgroundColor: bg, borderColor: active ? bg : p.border }]}>
      <Txt variant="bold" style={{ fontSize: 13 }} color={active ? '#FFFFFF' : p.text}>
        {emoji ? `${emoji} ` : ''}
        {label}
      </Txt>
    </Bouncy>
  );
}

export function Tag({ label, color, solid }: { label: string; color: string; solid?: boolean }) {
  return (
    <View style={[styles.tag, { backgroundColor: solid ? color : `${color}22`, borderColor: `${color}55` }]}>
      <Text style={[styles.tagText, { color: solid ? '#FFFFFF' : color }]}>{label}</Text>
    </View>
  );
}

export function LinkButton({ label, url, color }: { label: string; url: string | null | undefined; color?: string }) {
  const p = usePalette();
  if (!url) return null;
  return (
    <Bouncy
      accessibilityRole="link"
      onPress={() => openLink(url)}
      style={[styles.linkButton, { borderColor: color ?? p.accent }]}>
      <Txt variant="bold" style={{ fontSize: 13 }} color={color ?? p.accent}>
        {label} ↗
      </Txt>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.display, fontSize: 44, lineHeight: 46, letterSpacing: 1 },
  title: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: 0.8 },
  body: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 21 },
  bold: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20 },
  small: { fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: Fonts.bold, fontSize: 11.5, letterSpacing: 1.4, textTransform: 'uppercase' },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  tagText: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  linkButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
