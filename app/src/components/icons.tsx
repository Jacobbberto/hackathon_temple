import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string; accent?: string };

/** Home tab: a Philly rowhome with a cornice and a stoop. */
export function RowhomeIcon({ size = 26, color, accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={5} width={16} height={17} rx={1} fill={color} />
      <Rect x={3} y={3} width={18} height={3} rx={0.8} fill={color} />
      <Rect x={6.5} y={8.5} width={3.5} height={4} rx={0.5} fill={accent ?? '#fff'} />
      <Rect x={14} y={8.5} width={3.5} height={4} rx={0.5} fill={accent ?? '#fff'} />
      <Rect x={13.5} y={15} width={4} height={7} rx={0.6} fill={accent ?? '#fff'} />
      <Rect x={6.5} y={15.5} width={3.5} height={3.5} rx={0.5} fill={accent ?? '#fff'} />
    </Svg>
  );
}

/** Events tab: a ticket stub. */
export function TicketIcon({ size = 26, color, accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z"
        fill={color}
      />
      <Line x1={15} y1={6.5} x2={15} y2={17.5} stroke={accent ?? '#fff'} strokeWidth={1.4} strokeDasharray="1.6 1.6" />
      <Polygon points="9,8.2 10.1,10.6 12.6,10.8 10.7,12.4 11.3,14.9 9,13.6 6.7,14.9 7.3,12.4 5.4,10.8 7.9,10.6" fill={accent ?? '#fff'} />
    </Svg>
  );
}

/** Sports tab: a pennant. */
export function PennantIcon({ size = 26, color, accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={2.5} width={2.2} height={19} rx={1.1} fill={color} />
      <Path d="M5.2 4 L21 9.5 L5.2 15 Z" fill={color} />
      <Circle cx={10.5} cy={9.5} r={2.2} fill={accent ?? '#fff'} />
    </Svg>
  );
}

/** Politics tab: the Liberty Bell, crack included. */
export function BellIcon({ size = 26, color, accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={9} y={1.5} width={6} height={2.5} rx={1} fill={color} />
      <Path d="M12 3.5c-3.9 0-6 3.1-6 7.2v4.3c0 1.4-1.1 2.3-2.5 3.2h17c-1.4-.9-2.5-1.8-2.5-3.2v-4.3c0-4.1-2.1-7.2-6-7.2Z" fill={color} />
      <Rect x={3} y={17.8} width={18} height={2.2} rx={1.1} fill={color} />
      <Circle cx={12} cy={21.4} r={1.5} fill={color} />
      <Path d="M12.8 6.5 L11.6 9.5 L13 11.5 L11.8 14.5 L12.8 17" stroke={accent ?? '#fff'} strokeWidth={0.9} fill="none" />
    </Svg>
  );
}

/** The big bell on the Politics tab. */
export function LibertyBell({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* yoke */}
      <Rect x={18} y={6} width={64} height={9} rx={3} fill="#5B3A1E" />
      <Rect x={44} y={14} width={12} height={8} fill="#5B3A1E" />
      {/* bell body */}
      <Path
        d="M50 20c-15 0-23 11-23 27v15c0 6-5 10-11 14h68c-6-4-11-8-11-14V47c0-16-8-27-23-27Z"
        fill="#B8863B"
      />
      <Path d="M50 20c-6 0-10 3-13 8 3-2 7-3 13-3s10 1 13 3c-3-5-7-8-13-8Z" fill="#D8A95A" />
      <Rect x={12} y={74} width={76} height={8} rx={4} fill="#9A6E2E" />
      <Rect x={22} y={58} width={56} height={3} fill="#9A6E2E" opacity={0.6} />
      {/* the crack */}
      <Path d="M54 36 L49 45 L55 52 L49 61 L53 68 L50 76" stroke="#3A2410" strokeWidth={2.4} fill="none" strokeLinejoin="round" />
      <Circle cx={50} cy={88} r={6} fill="#8A5F24" />
    </Svg>
  );
}

export function WeatherIcon({ icon, size = 64, night }: { icon: string; size?: number; night?: boolean }) {
  const sun = night ? (
    <G>
      <Circle cx={22} cy={22} r={12} fill="#FFF3C4" />
      <Circle cx={27} cy={18} r={11} fill="#1D3160" />
    </G>
  ) : (
    <G>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <Line
            key={i}
            x1={22 + Math.cos(a) * 15}
            y1={22 + Math.sin(a) * 15}
            x2={22 + Math.cos(a) * 20}
            y2={22 + Math.sin(a) * 20}
            stroke="#F5B800"
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={22} cy={22} r={11} fill="#FFD23F" />
    </G>
  );
  const cloud = (fill: string, dy = 0) => (
    <Path
      d={`M20 ${50 + dy}h30a10 10 0 0 0 0-20 14 14 0 0 0-26-4 9 9 0 0 0-4 24Z`}
      fill={fill}
      stroke="#A9B6C8"
      strokeWidth={1.5}
    />
  );
  const drops = (color: string, snow?: boolean) => (
    <G>
      {[24, 34, 44].map((x, i) =>
        snow ? (
          <Circle key={x} cx={x} cy={58 + (i % 2) * 3} r={2.6} fill={color} />
        ) : (
          <Line key={x} x1={x} y1={55} x2={x - 3} y2={62 + (i % 2) * 2} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
        ),
      )}
    </G>
  );

  let body;
  switch (icon) {
    case 'clear':
      body = <G transform="translate(10 10)">{sun}</G>;
      break;
    case 'partly-cloudy':
      body = (
        <G>
          {sun}
          {cloud('#EEF2F8', 4)}
        </G>
      );
      break;
    case 'rain':
    case 'drizzle':
      body = (
        <G>
          {cloud('#B8C4D6', -6)}
          {drops('#3B82F6')}
        </G>
      );
      break;
    case 'snow':
      body = (
        <G>
          {cloud('#DCE4EF', -6)}
          {drops('#FFFFFF', true)}
        </G>
      );
      break;
    case 'storm':
      body = (
        <G>
          {cloud('#7C889C', -6)}
          <Polygon points="36,46 28,60 35,60 31,70 44,54 37,54 41,46" fill="#F5B800" />
        </G>
      );
      break;
    case 'fog':
      body = (
        <G>
          {cloud('#C9D2DE', -8)}
          {[50, 57, 64].map((y) => (
            <Line key={y} x1={14} y1={y} x2={58} y2={y} stroke="#AEB9C9" strokeWidth={3} strokeLinecap="round" />
          ))}
        </G>
      );
      break;
    default:
      body = cloud('#D5DDE8');
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      {body}
    </Svg>
  );
}
