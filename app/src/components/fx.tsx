import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Brand, Fonts, Radius, TabBarHeight, useNativeDriver } from '@/constants/theme';
import { TEAM_CHANTS } from '@/constants/philly';
import { cheer, thump } from '@/lib/haptics';

/**
 * App-wide celebrations: confetti bursts, toasts, and the stadium chant overlay
 * (E! A! G! L! E! S! EAGLES!).
 */
type Fx = {
  confetti: (colors?: string[]) => void;
  toast: (message: string) => void;
  chant: (teamKey: string, colors: string[]) => void;
};

const FxContext = createContext<Fx>({ confetti: () => {}, toast: () => {}, chant: () => {} });

export const useFx = () => useContext(FxContext);

const PHILLY_COLORS = [Brand.blue, Brand.gold, Brand.cone, '#FFFFFF', Brand.green];

/** Keep the newest callback without restarting animations when a parent re-renders. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export function FxProvider({ children }: { children: ReactNode }) {
  const [burst, setBurst] = useState<{ id: number; colors: string[] } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null);
  const [chantState, setChantState] = useState<{ id: number; tokens: string[]; colors: string[] } | null>(null);

  const confetti = useCallback((colors?: string[]) => {
    setBurst({ id: Date.now(), colors: colors?.length ? colors : PHILLY_COLORS });
  }, []);
  const toast = useCallback((text: string) => setToastMsg({ id: Date.now(), text }), []);
  const chant = useCallback((teamKey: string, colors: string[]) => {
    const c = TEAM_CHANTS[teamKey] ?? TEAM_CHANTS.eagles;
    setChantState({ id: Date.now(), tokens: [...c.letters, c.finale], colors });
  }, []);

  const value = useMemo(() => ({ confetti, toast, chant }), [confetti, toast, chant]);

  return (
    <FxContext.Provider value={value}>
      {children}
      {chantState ? (
        <ChantOverlay
          key={chantState.id}
          tokens={chantState.tokens}
          colors={chantState.colors}
          onFinale={() => confetti(chantState.colors.concat('#FFFFFF'))}
          onDone={() => setChantState(null)}
        />
      ) : null}
      {burst ? <Confetti key={burst.id} colors={burst.colors} onDone={() => setBurst(null)} /> : null}
      {toastMsg ? <Toast key={toastMsg.id} text={toastMsg.text} onDone={() => setToastMsg(null)} /> : null}
    </FxContext.Provider>
  );
}

function Confetti({ colors, onDone }: { colors: string[]; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [pieces] = useState(() =>
    Array.from({ length: 42 }, (_, i) => ({
      left: Math.random() * width,
      drift: (Math.random() - 0.5) * 160,
      fall: height * (0.7 + Math.random() * 0.4),
      spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`,
      delay: Math.random() * 0.25,
      size: 7 + Math.random() * 7,
      color: colors[i % colors.length],
      round: Math.random() > 0.6,
    })),
  );

  const done = useLatest(onDone);
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.quad),
      useNativeDriver,
    }).start(() => done.current());
  }, [progress, done]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => {
        const start = piece.delay;
        const translateY = progress.interpolate({ inputRange: [0, start, 1], outputRange: [-30, -30, piece.fall] });
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', piece.spin] });
        const opacity = progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: piece.left,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 0.45,
              borderRadius: piece.round ? piece.size : 2,
              backgroundColor: piece.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  const [anim] = useState(() => new Animated.Value(0));
  const done = useLatest(onDone);
  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver, bounciness: 10 }),
      Animated.delay(2600),
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver }),
    ]).start(() => done.current());
  }, [anim, done]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <Animated.View style={[styles.toast, { opacity: anim, transform: [{ translateY }] }]}>
        <Text style={styles.toastText}>{text}</Text>
      </Animated.View>
    </View>
  );
}

function ChantOverlay({
  tokens,
  colors,
  onFinale,
  onDone,
}: {
  tokens: string[];
  colors: string[];
  onFinale: () => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [pop] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(0));
  const finaleFired = useRef(false);
  const callbacks = useLatest({ onFinale, onDone });
  const isFinale = index === tokens.length - 1;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 150, useNativeDriver }).start();
  }, [fade]);

  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver, speed: 18, bounciness: 16 }).start();
    if (isFinale) {
      if (!finaleFired.current) {
        finaleFired.current = true;
        cheer();
        callbacks.current.onFinale();
      }
      const t = setTimeout(() => {
        Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver }).start(() => callbacks.current.onDone());
      }, 1300);
      return () => clearTimeout(t);
    }
    thump();
    const t = setTimeout(() => setIndex((i) => i + 1), 420);
    return () => clearTimeout(t);
  }, [index, isFinale, pop, fade, callbacks]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const main = colors[0] ?? Brand.green;
  const accent = colors[1] ?? '#FFFFFF';
  const sung = tokens.slice(0, Math.min(index, tokens.length - 1));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.chantWrap, { opacity: fade }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: main, opacity: 0.88 }]} />
      <Text style={[styles.chantTrail, { color: accent }]}>{sung.join(isFinale ? ' · ' : '! ')}</Text>
      <Animated.Text
        style={[styles.chantMain, isFinale && styles.chantFinale, { transform: [{ scale }] }]}
        numberOfLines={2}
        adjustsFontSizeToFit>
        {isFinale ? tokens[index] : `${tokens[index]}!`}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TabBarHeight + 36,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  toast: {
    backgroundColor: Brand.ink,
    borderColor: Brand.gold,
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 460,
  },
  toastText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15, textAlign: 'center' },
  chantWrap: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  chantTrail: { fontFamily: Fonts.display, fontSize: 30, letterSpacing: 4, marginBottom: 8, textAlign: 'center' },
  chantMain: {
    fontFamily: Fonts.display,
    fontSize: 150,
    lineHeight: 160,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
  },
  chantFinale: { fontSize: 76, lineHeight: 84 },
});
