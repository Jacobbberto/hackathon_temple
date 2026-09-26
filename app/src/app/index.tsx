import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHome } from '@/api/hooks';
import type { HomeResponse } from '@/api/types';
import { EventCard } from '@/components/events';
import { HeadlineRow, SlangCard, WeatherCard } from '@/components/home';
import { DataStatus, ErrorState, LoadingJawn, RefreshButton, Screen } from '@/components/Screen';
import { Skyline, skyFor } from '@/components/Skyline';
import { MiniGame } from '@/components/sports';
import { Bouncy, Card, SectionTitle, Txt } from '@/components/ui';
import { greetingFor } from '@/constants/philly';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { usePalette } from '@/lib/theme';
import { formatLongDay, phillyHour } from '@/lib/time';

function Hero({ data, onRefresh, refreshing }: { data?: HomeResponse; onRefresh: () => void; refreshing: boolean }) {
  const insets = useSafeAreaInsets();
  const hour = phillyHour();
  const sky = skyFor(hour);
  const greeting = greetingFor(hour, new Date().getDate());
  return (
    <View style={{ height: 330 + insets.top }}>
      <Skyline hour={hour}>
        <View pointerEvents="box-none" style={[styles.heroText, { paddingTop: insets.top + Spacing.lg }]}>
          <Txt variant="label" color={sky.subtext}>
            PhillyPulse · {formatLongDay()}
          </Txt>
          <Txt variant="display" color={sky.text} style={styles.greeting}>
            {greeting}
          </Txt>
          {data?.weather?.temp_f != null ? (
            <Txt variant="bold" color={sky.subtext}>
              {Math.round(data.weather.temp_f)}° and {data.weather.condition.toLowerCase()} in the city
            </Txt>
          ) : null}
          <View pointerEvents="box-none" style={styles.heroMeta}>
            <DataStatus sources={data?.sources} onDark={sky.text === '#FFFFFF'} />
            {Platform.OS === 'web' ? <RefreshButton onPress={onRefresh} spinning={refreshing} /> : null}
          </View>
        </View>
      </Skyline>
    </View>
  );
}

function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Bouncy onPress={onPress}>
      <Txt variant="bold" color={p.accent} style={{ fontSize: 14 }}>
        {label} →
      </Txt>
    </Bouncy>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const p = usePalette();
  const { data, isPending, isError, error, refetch, isRefetching } = useHome();

  return (
    <Screen
      header={<Hero data={data} onRefresh={() => refetch()} refreshing={isRefetching} />}
      refreshing={isRefetching}
      onRefresh={() => refetch()}>
      {isPending ? (
        <LoadingJawn />
      ) : isError || !data ? (
        <ErrorState message={error?.message ?? 'Something went sideways.'} onRetry={() => refetch()} />
      ) : (
        <>
          <SectionTitle kicker="Right now" title="Weather" />
          <WeatherCard weather={data.weather} />

          <SectionTitle
            kicker="Today in Philly"
            title="Game day?"
            right={<SeeAll label="All games" onPress={() => router.navigate('/sports')} />}
          />
          {data.sports_today.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
              {data.sports_today.map((g) => (
                <MiniGame key={g.id} game={g} onPress={() => router.navigate('/sports')} />
              ))}
            </ScrollView>
          ) : (
            <Card>
              <Txt variant="bold">No Philly teams play today.</Txt>
              <Txt muted>Rest those vocal cords. Next games are on the Sports tab.</Txt>
            </Card>
          )}

          <SectionTitle kicker="Last 24 hours" title="Top headlines" />
          <Card style={{ paddingVertical: 0 }}>
            {data.headlines.length ? (
              data.headlines.map((h, i) => <HeadlineRow key={h.id} item={h} rank={i + 1} />)
            ) : (
              <Txt muted style={{ paddingVertical: Spacing.lg }}>
                Slow news day. Enjoy it.
              </Txt>
            )}
          </Card>
          <Txt variant="small" muted style={{ marginTop: Spacing.sm }}>
            Headlines link to the original local outlets. Support local journalism!
          </Txt>

          <SectionTitle
            kicker="This week"
            title="Coming up"
            right={<SeeAll label="All events" onPress={() => router.navigate('/events')} />}
          />
          <View style={{ gap: Spacing.md }}>
            {data.upcoming_events.map((e) => (
              <EventCard key={e.id} event={e} showDate />
            ))}
          </View>

          <SectionTitle kicker="Jawn of the day" title="Talk like a local" />
          <SlangCard />

          <View style={[styles.footer, { borderColor: p.border }]}>
            <Txt variant="title" style={{ fontSize: 22 }} color={p.accent}>
              Made wit’ 💛 in Philly
            </Txt>
            <Txt variant="small" muted style={{ textAlign: 'center' }}>
              OwlHacks 2026 · Philly Special track. Tip: tap Billy Penn on top of City Hall.
            </Txt>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroText: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 2,
  },
  greeting: { fontSize: 46, lineHeight: 48, maxWidth: 320 },
  heroMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  strip: { gap: Spacing.md, paddingRight: Spacing.lg, paddingVertical: 4 },
  footer: {
    marginTop: Spacing.xxl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
});
