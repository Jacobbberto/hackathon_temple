import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSports } from '@/api/hooks';
import type { Game } from '@/api/types';
import { useFx } from '@/components/fx';
import { ErrorState, LoadingJawn, PageHeader, Screen } from '@/components/Screen';
import { GameCard, Segmented, TeamPennants } from '@/components/sports';
import { Bouncy, Card, Txt } from '@/components/ui';
import { EMPTY_LINES } from '@/constants/philly';
import { Brand, Spacing } from '@/constants/theme';

type View_ = 'live' | 'upcoming' | 'recent';

function GoBirds() {
  const fx = useFx();
  return (
    <Bouncy
      haptic={false}
      accessibilityLabel="Go Birds! Start the E-A-G-L-E-S chant"
      onPress={() => fx.chant('eagles', [Brand.green, '#A5ACAF'])}
      style={styles.goBirds}>
      <Txt style={{ fontSize: 24, lineHeight: 28 }}>🦅</Txt>
      <Txt variant="title" color="#FFFFFF" style={{ fontSize: 17, lineHeight: 18, textAlign: 'center' }}>
        GO{'\n'}BIRDS
      </Txt>
    </Bouncy>
  );
}

export default function SportsScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useSports();
  const [team, setTeam] = useState<string | null>(null);
  const [picked, setPicked] = useState<View_ | null>(null);

  const byTeam = (games: Game[]) => games.filter((g) => !team || g.team === team);
  const live = byTeam(data?.live ?? []);
  const upcoming = byTeam(data?.upcoming ?? []);
  const recent = byTeam(data?.recent ?? []);
  const view: View_ = picked ?? (live.length ? 'live' : 'upcoming');
  const games = view === 'live' ? live : view === 'upcoming' ? upcoming : recent;

  return (
    <Screen
      header={
        <PageHeader
          title="Sports"
          tagline="Birds, Phils, Sixers, Flyers, Union, Owls."
          color={Brand.green}
          sources={data?.sources}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
          right={<GoBirds />}
        />
      }
      refreshing={isRefetching}
      onRefresh={() => refetch()}>
      {isPending ? (
        <LoadingJawn />
      ) : isError || !data ? (
        <ErrorState message={error?.message ?? 'Something went sideways.'} onRetry={() => refetch()} />
      ) : (
        <>
          <View style={{ marginTop: Spacing.md }}>
            <TeamPennants teams={data.teams} selected={team} onSelect={setTeam} />
          </View>
          <Txt variant="small" muted style={{ marginBottom: Spacing.md }}>
            Tap a pennant to filter (and start the chant). Live scores refresh every minute.
          </Txt>
          <Segmented
            value={view}
            onChange={setPicked}
            options={[
              { key: 'live', label: 'Live', count: live.length },
              { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { key: 'recent', label: 'Recent', count: recent.length },
            ]}
          />
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {games.length ? (
              games.map((g) => <GameCard key={g.id} game={g} />)
            ) : (
              <Card style={{ alignItems: 'center', gap: 6, paddingVertical: Spacing.xl }}>
                <Txt style={{ fontSize: 44, lineHeight: 52 }}>{view === 'live' ? '🥪' : view === 'upcoming' ? '📅' : '🏆'}</Txt>
                <Txt variant="bold" style={{ textAlign: 'center' }}>
                  {EMPTY_LINES[view]}
                </Txt>
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  goBirds: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#003940',
    borderWidth: 3,
    borderColor: '#A5ACAF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
