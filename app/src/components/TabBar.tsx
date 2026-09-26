import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Brand, Fonts, MaxContentWidth, Radius, TabBarHeight, useNativeDriver } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { usePalette } from '@/lib/theme';
import { BellIcon, PennantIcon, RowhomeIcon, TicketIcon } from './icons';
import { Txt } from './ui';

const ICONS = {
  index: RowhomeIcon,
  events: TicketIcon,
  sports: PennantIcon,
  politics: BellIcon,
} as const;

function TabItem({
  label,
  routeName,
  focused,
  onPress,
}: {
  label: string;
  routeName: string;
  focused: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  const [pop] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    Animated.spring(pop, { toValue: focused ? 1 : 0, useNativeDriver, speed: 16, bounciness: 14 }).start();
  }, [focused, pop]);

  const Icon = ICONS[routeName as keyof typeof ICONS] ?? RowhomeIcon;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const translateY = pop.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={styles.item}>
      <Animated.View
        style={[
          styles.iconPill,
          { backgroundColor: focused ? Brand.gold : 'transparent', transform: [{ scale }, { translateY }] },
        ]}>
        <Icon size={24} color={focused ? Brand.ink : p.textMuted} accent={focused ? Brand.gold : p.tabBar} />
      </Animated.View>
      <Txt
        variant="label"
        color={focused ? p.text : p.textMuted}
        style={{ fontSize: 10.5, letterSpacing: 1, fontFamily: focused ? Fonts.black : Fonts.bold }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Bottom tabs with a city-flag stripe on top: Home, Events, Sports, Politics. */
export function PulseTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const p = usePalette();
  return (
    <View style={[styles.bar, { backgroundColor: p.tabBar, paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.flagStripe}>
        <View style={{ flex: 1, backgroundColor: Brand.blue }} />
        <View style={{ flex: 1, backgroundColor: Brand.gold }} />
      </View>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              label={options.title ?? route.name}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 0 },
  flagStripe: { flexDirection: 'row', height: 4 },
  row: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    height: TabBarHeight,
    alignItems: 'center',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: Radius.pill },
});
