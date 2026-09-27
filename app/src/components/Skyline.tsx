import { useEffect, useId, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { BILLY_PENN_OUTFITS } from '@/constants/philly';
import { useNativeDriver } from '@/constants/theme';
import { useFx } from './fx';
import { tap } from '@/lib/haptics';

const W = 400;
const H = 170;
const MAX_DRAWING_WIDTH = 760;

type Sky = {
  top: string;
  bottom: string;
  text: string;
  subtext: string;
  near: string;
  far: string;
  window: string;
  water: string;
  night: boolean;
  dusk: boolean;
};

export function skyFor(hour: number): Sky {
  if (hour >= 21 || hour < 5)
    return { top: '#070E1F', bottom: '#1D3160', text: '#FFFFFF', subtext: '#C9D6F2', near: '#0A1222', far: '#1A2A4C', window: '#FFD66B', water: '#0D1D3A', night: true, dusk: false };
  if (hour < 8)
    return { top: '#34407E', bottom: '#F9A77B', text: '#FFFFFF', subtext: '#FFF1E0', near: '#1F2744', far: '#6A5D8C', window: '#FFE7A8', water: '#4A5FA0', night: false, dusk: true };
  if (hour < 17)
    return { top: '#4F95EA', bottom: '#D4ECFF', text: '#0E1A2B', subtext: '#1F3656', near: '#1C2A44', far: '#8DB2DA', window: '#BFD9F5', water: '#3B79C4', night: false, dusk: false };
  return { top: '#3A2A6B', bottom: '#FF8A5B', text: '#FFFFFF', subtext: '#FFE9DA', near: '#1A1733', far: '#7A4E7E', window: '#FFD66B', water: '#3E3570', night: false, dusk: true };
}

// Deterministic "random" so windows don't jump around between renders.
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const ROWHOMES = [
  { x: 0, top: 114, brick: '#B5452E', door: '#1D4E9E' },
  { x: 22, top: 118, brick: '#A33D29', door: '#0E7C66' },
  { x: 44, top: 112, brick: '#C4563A', door: '#F5B800' },
  { x: 66, top: 116, brick: '#8F3A2A', door: '#E81828' },
  { x: 88, top: 120, brick: '#B5452E', door: '#004C54' },
  { x: 110, top: 113, brick: '#A8472F', door: '#6B2FA0' },
  { x: 132, top: 117, brick: '#C05034', door: '#1D4E9E' },
];

const BOATHOUSES = [
  { x: 244, w: 22, roof: 10 },
  { x: 268, w: 18, roof: 12 },
  { x: 288, w: 26, roof: 9 },
  { x: 316, w: 20, roof: 13 },
  { x: 338, w: 24, roof: 10 },
  { x: 364, w: 18, roof: 12 },
  { x: 384, w: 20, roof: 9 },
];

/** Towers: [x, width, top y]. Windows are sprinkled on these at night. */
const TOWERS: [number, number, number][] = [
  [268, 20, 30], // One Liberty
  [291, 14, 50], // Two Liberty
  [309, 18, 22], // Comcast Center
  [331, 20, 12], // Comcast Technology Center
  [355, 16, 62],
];

function Windows({ sky }: { sky: Sky }) {
  const lights: ReactNode[] = [];
  TOWERS.forEach(([x, w, top], ti) => {
    for (let y = top + 8; y < 140; y += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 4) {
        const r = rand(ti * 1000 + y * 10 + wx);
        if (r > (sky.night ? 0.55 : 0.8)) {
          lights.push(<Rect key={`${ti}-${y}-${wx}`} x={wx} y={y} width={1.8} height={2.4} fill={sky.window} opacity={sky.night ? 0.9 : 0.35} />);
        }
      }
    }
  });
  return <G>{lights}</G>;
}

function Rowhome({ x, top, brick, door, sky }: (typeof ROWHOMES)[number] & { sky: Sky }) {
  const lit = sky.night || sky.dusk;
  const win = lit ? '#FFD66B' : '#CFE3F7';
  return (
    <G>
      <Rect x={x} y={top} width={22} height={150 - top} fill={sky.night ? '#4A2320' : brick} />
      <Rect x={x - 0.5} y={top - 2.5} width={23} height={3.5} fill={sky.night ? '#2A1614' : '#5B2A1F'} />
      <Rect x={x + 3.5} y={top + 6} width={5} height={7} fill={win} />
      <Rect x={x + 13.5} y={top + 6} width={5} height={7} fill={win} opacity={rand(x) > 0.4 ? 1 : 0.6} />
      <Rect x={x + 3.5} y={top + 19} width={5} height={7} fill={win} opacity={rand(x + 3) > 0.5 ? 1 : 0.55} />
      <Rect x={x + 13} y={140} width={6} height={10} fill={door} />
      <Rect x={x + 11.5} y={148.5} width={9} height={1.5} fill="#E7DCCB" />
    </G>
  );
}

function CityHall({ sky, outfit }: { sky: Sky; outfit: (typeof BILLY_PENN_OUTFITS)[number] }) {
  const stone = sky.night ? '#262B3D' : sky.dusk ? '#6B5A57' : '#C9B9A0';
  const trim = sky.night ? '#161A28' : sky.dusk ? '#4D3F3E' : '#A89679';
  return (
    <G>
      {/* main building and corner pavilions */}
      <Rect x={220} y={120} width={44} height={30} fill={stone} />
      <Polygon points="218,122 224,114 230,122" fill={trim} />
      <Polygon points="254,122 260,114 266,122" fill={trim} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={223 + i * 8} y={127} width={3} height={6} fill={sky.night ? '#FFD66B' : '#6E7C94'} opacity={0.8} />
      ))}
      {/* tower */}
      <Rect x={236} y={66} width={12} height={54} fill={stone} />
      <Rect x={237.5} y={54} width={9} height={12} fill={stone} />
      <Circle cx={242} cy={76} r={3.6} fill={sky.night ? '#FFF6D8' : '#FFFFFF'} stroke={trim} strokeWidth={0.8} />
      <Line x1={242} y1={76} x2={242} y2={73.8} stroke="#0E1A2B" strokeWidth={0.6} />
      <Line x1={242} y1={76} x2={243.6} y2={76} stroke="#0E1A2B" strokeWidth={0.6} />
      <Path d="M237.5 54 Q242 41 246.5 54 Z" fill={trim} />
      {/* William Penn, in whatever jersey the city put on him */}
      <G>
        <Rect x={240.6} y={34} width={2.8} height={7.6} rx={0.8} fill={outfit.color} />
        <Rect x={240.6} y={36.5} width={2.8} height={1.2} fill={outfit.accent} />
        <Circle cx={242} cy={32.4} r={1.5} fill={outfit.team === 'bronze' ? outfit.color : '#8C6A3F'} />
        <Rect x={240.2} y={30.3} width={3.6} height={0.9} fill="#5E4527" />
      </G>
    </G>
  );
}

function Cone({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Polygon points={`${x - 3.5},${y} ${x},${y - 11} ${x + 3.5},${y}`} fill="#FF6A13" />
      <Rect x={x - 2.2} y={y - 6} width={4.4} height={1.6} fill="#FFFFFF" />
      <Rect x={x - 5} y={y - 0.5} width={10} height={1.8} fill="#E0560C" />
    </G>
  );
}

function LoveSculpture({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x + 5} y={y + 13} width={4} height={10} fill="#7A8699" />
      <Rect x={x} y={y} width={14} height={13} fill="#D7263D" rx={1} />
      <SvgText x={x + 3.2} y={y + 6} fontSize={5.5} fontWeight="bold" fill="#FFFFFF">
        L
      </SvgText>
      <G transform={`rotate(-18 ${x + 9} ${y + 4.5})`}>
        <SvgText x={x + 7.2} y={y + 6.4} fontSize={5.5} fontWeight="bold" fill="#FFFFFF">
          O
        </SvgText>
      </G>
      <SvgText x={x + 3} y={y + 11.8} fontSize={5.5} fontWeight="bold" fill="#FFFFFF">
        V
      </SvgText>
      <SvgText x={x + 7.6} y={y + 11.8} fontSize={5.5} fontWeight="bold" fill="#FFFFFF">
        E
      </SvgText>
    </G>
  );
}

/** A layer that gently pulses: boathouse lights and stars. */
function Twinkle({ children, speed = 1400 }: { children: ReactNode; speed?: number }) {
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.35, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(v, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, speed]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: v, pointerEvents: 'none' }]}>
      {children}
    </Animated.View>
  );
}

type Props = { hour: number; children?: ReactNode };

/**
 * The Philly skyline from the Schuylkill: rowhomes, City Hall and Billy Penn, the Liberty
 * towers, the Comcast towers and Boathouse Row. Tap Billy Penn, the LOVE statue or the
 * traffic cone.
 */
export function Skyline({ hour, children }: Props) {
  const sky = skyFor(hour);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fx = useFx();
  const [outfitIndex, setOutfitIndex] = useState(BILLY_PENN_OUTFITS.length - 1);
  const outfit = BILLY_PENN_OUTFITS[outfitIndex];

  const dressBilly = () => {
    const next = (outfitIndex + 1) % BILLY_PENN_OUTFITS.length;
    setOutfitIndex(next);
    const o = BILLY_PENN_OUTFITS[next];
    fx.toast(o.line);
    if (o.team !== 'bronze') fx.confetti([o.color, o.accent, '#FFFFFF']);
    tap();
  };

  const lights = sky.night || sky.dusk;

  // Sky fills the whole box; the drawing sits bottom-center at its natural aspect ratio
  // (capped on wide screens, where the street and river just keep going).
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const w = box?.w ?? W;
  const h = box?.h ?? H;
  const dw = Math.min(w, MAX_DRAWING_WIDTH);
  const scale = dw / W;
  const dh = H * scale;
  const left = (w - dw) / 2;
  const top = h - dh;
  const spot = (x: number, y: number) => ({ left: left + x * scale - 18, top: top + y * scale - 18 });
  const drawingBox = { position: 'absolute' as const, left, top, width: dw, height: dh };

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width && height) setBox({ w: width, h: height });
      }}>
      {/* backdrop: sky, plus street (left) and river (right) running past the drawing */}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#sky${id})`} />
        <Rect x={0} y={top + 150 * scale} width={left + 1} height={20 * scale} fill={sky.night ? '#1B1F2A' : '#3A3F4B'} />
        <Rect x={0} y={top + 150 * scale} width={left + 1} height={4 * scale} fill={sky.night ? '#3B3A40' : '#CDBFA6'} />
        <Rect x={left + dw - 1} y={top + 152 * scale} width={left + 1} height={18 * scale} fill={sky.water} />
      </Svg>

      <View style={[drawingBox, { pointerEvents: 'none' }]}>
        <Svg width={dw} height={dh} viewBox={`0 0 ${W} ${H}`}>
          {/* sun or moon, off to the east */}
          {sky.night ? (
            <G>
              <Circle cx={380} cy={30} r={10} fill="#FFF3C4" />
              <Circle cx={385} cy={27} r={9} fill={sky.top} />
            </G>
          ) : (
            <Circle cx={sky.dusk ? 386 : 380} cy={sky.dusk ? 74 : 30} r={sky.dusk ? 14 : 11} fill={sky.dusk ? '#FFC36B' : '#FFD84D'} opacity={0.95} />
          )}

          {/* distant buildings */}
          <G fill={sky.far}>
            <Rect x={200} y={96} width={14} height={60} />
            <Rect x={256} y={74} width={12} height={80} />
            <Rect x={302} y={84} width={10} height={70} />
            <Rect x={372} y={88} width={28} height={70} />
            <Rect x={160} y={104} width={20} height={50} />
          </G>

          {/* skyscrapers: One & Two Liberty, the two Comcast towers */}
          <G fill={sky.near}>
            <Rect x={268} y={30} width={20} height={124} />
            <Polygon points="268,30 272,23 275,23 278,15 281,23 284,23 288,30" />
            <Line x1={278} y1={15} x2={278} y2={3} stroke={sky.near} strokeWidth={1} />
            <Rect x={291} y={50} width={14} height={104} />
            <Polygon points="291,50 298,40 305,50" />
            <Polygon points="309,26 327,18 327,154 309,154" />
            <Rect x={331} y={14} width={20} height={140} />
            <Rect x={334} y={6} width={14} height={6} />
            <Rect x={355} y={62} width={16} height={92} />
          </G>
          <Rect x={318} y={22} width={2} height={130} fill="#FFFFFF" opacity={0.08} />
          <Rect x={341} y={16} width={2} height={136} fill="#FFFFFF" opacity={0.08} />
          <Windows sky={sky} />

          <CityHall sky={sky} outfit={outfit} />

          {/* rowhomes, the heart of it */}
          {ROWHOMES.map((r) => (
            <Rowhome key={r.x} {...r} sky={sky} />
          ))}

          {/* street, pavement and river */}
          <Rect x={0} y={150} width={236} height={20} fill={sky.night ? '#1B1F2A' : '#3A3F4B'} />
          <Rect x={0} y={150} width={236} height={4} fill={sky.night ? '#3B3A40' : '#CDBFA6'} />
          {[8, 36, 64, 92, 120, 148, 176, 204].map((x) => (
            <Rect key={x} x={x} y={162} width={14} height={1.6} fill="#F5B800" opacity={0.9} />
          ))}
          <Rect x={236} y={152} width={164} height={18} fill={sky.water} />
          <Rect x={232} y={148} width={6} height={22} fill={sky.night ? '#2A2E3A' : '#8C8577'} />
          <Cone x={162} y={152} />
          <Cone x={196} y={152} />
          <LoveSculpture x={176} y={127} />

          {/* Boathouse Row */}
          {BOATHOUSES.map((b) => (
            <G key={b.x}>
              <Rect x={b.x} y={140} width={b.w} height={12} fill={sky.night ? '#161C2E' : '#F1E6D0'} />
              <Polygon points={`${b.x - 1},140 ${b.x + b.w / 2},${140 - b.roof} ${b.x + b.w + 1},140`} fill={sky.night ? '#0F1424' : '#2B3A55'} />
              <Rect x={b.x + b.w / 2 - 2.5} y={144} width={5} height={8} fill={sky.night ? '#2A3350' : '#6B7A96'} />
            </G>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} x1={246 + i * 38} y1={158 + (i % 2) * 5} x2={268 + i * 38} y2={158 + (i % 2) * 5} stroke="#FFFFFF" strokeWidth={0.8} opacity={0.3} />
          ))}
        </Svg>
      </View>

      {/* Boathouse Row's famous outline lights and the stars, twinkling after dark */}
      {lights ? (
        <Twinkle>
          {sky.night ? (
            <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
              {Array.from({ length: 22 }, (_, i) => (
                <Circle
                  key={i}
                  cx={w * (0.55 + rand(i) * 0.45)}
                  cy={6 + rand(i + 50) * Math.max(40, top + 60 * scale)}
                  r={rand(i + 99) > 0.7 ? 1.4 : 0.8}
                  fill="#FFFFFF"
                />
              ))}
            </Svg>
          ) : null}
          <View style={drawingBox}>
            <Svg width={dw} height={dh} viewBox={`0 0 ${W} ${H}`}>
              {BOATHOUSES.map((b) => (
                <G key={b.x}>
                  <Path
                    d={`M${b.x - 1} 152 L${b.x - 1} 140 L${b.x + b.w / 2} ${140 - b.roof} L${b.x + b.w + 1} 140 L${b.x + b.w + 1} 152`}
                    stroke="#FFE9A8"
                    strokeWidth={1}
                    strokeDasharray="1.4 1.6"
                    fill="none"
                  />
                  <Line x1={b.x + b.w / 2} y1={154} x2={b.x + b.w / 2} y2={168} stroke="#FFE9A8" strokeWidth={1} strokeDasharray="1 2" opacity={0.6} />
                </G>
              ))}
            </Svg>
          </View>
        </Twinkle>
      ) : null}

      {children ? <View style={StyleSheet.absoluteFill}>{children}</View> : null}

      {/* Tap targets for the easter eggs */}
      {box ? (
        <>
          <HotSpot at={spot(242, 36)} label="Dress up Billy Penn" onPress={dressBilly} />
          <HotSpot
            at={spot(183, 134)}
            label="LOVE statue"
            onPress={() => {
              fx.toast('City of Brotherly Love & Sisterly Affection 💛');
              fx.confetti(['#D7263D', '#FF7A9A', '#FFFFFF']);
            }}
          />
          <HotSpot
            at={spot(162, 146)}
            label="Traffic cone"
            onPress={() => fx.toast('The traffic cone: Philly’s official city flower 🚧')}
          />
        </>
      ) : null}
    </View>
  );
}

function HotSpot({ at, label, onPress }: { at: { left: number; top: number }; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[styles.hot, at]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: '100%', overflow: 'hidden' },
  hot: { position: 'absolute', width: 36, height: 36, borderRadius: 18 },
});
