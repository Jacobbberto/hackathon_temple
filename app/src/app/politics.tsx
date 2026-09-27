import { useState } from 'react';
import { View } from 'react-native';

import { usePolitics } from '@/api/hooks';
import { BillCard, ElectionCountdown, HearingCard, PhillyHistory } from '@/components/politics';
import { ErrorState, LoadingJawn, PageHeader, Screen } from '@/components/Screen';
import { Segmented } from '@/components/sports';
import { Card, SectionTitle, Txt } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { daysBetween, phillyDay } from '@/lib/time';

type Stage = 'all' | 'Introduced' | 'Passed';

export default function PoliticsScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = usePolitics();
  const [stage, setStage] = useState<Stage>('all');

  const today = phillyDay();
  const hearings = data?.hearings ?? [];
  const thisWeek = hearings.filter((h) => daysBetween(today, phillyDay(new Date(h.start))) < 7);
  const nextWeek = hearings.filter((h) => daysBetween(today, phillyDay(new Date(h.start))) >= 7);
  const bills = (data?.bills ?? []).filter((b) => stage === 'all' || b.stage === stage);

  return (
    <Screen
      header={
        <PageHeader
          title="Politics"
          tagline="City Hall, decoded. No spin."
          color={Brand.blueDeep}
          sources={data?.sources}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
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
          <SectionTitle kicker="Your vote" title="Election countdown" />
          <ElectionCountdown election={data.election} />

          <SectionTitle kicker="Room 400 and beyond" title="This week at City Hall" />
          <View style={{ gap: Spacing.md }}>
            {thisWeek.length ? (
              thisWeek.map((h) => <HearingCard key={h.id} hearing={h} />)
            ) : (
              <Card>
                <Txt variant="bold">No Council hearings or sessions this week.</Txt>
                <Txt muted>Council breaks in summer and around the holidays.</Txt>
              </Card>
            )}
          </View>
          {nextWeek.length ? (
            <>
              <Txt variant="label" muted style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
                Next week
              </Txt>
              <View style={{ gap: Spacing.md }}>
                {nextWeek.map((h) => (
                  <HearingCard key={h.id} hearing={h} />
                ))}
              </View>
            </>
          ) : null}

          <SectionTitle kicker="In plain English" title="New & passed bills" />
          <Segmented
            value={stage}
            onChange={setStage}
            options={[
              { key: 'all', label: 'All' },
              { key: 'Introduced', label: 'Introduced' },
              { key: 'Passed', label: 'Passed' },
            ]}
          />
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {bills.length ? (
              bills.map((b) => <BillCard key={b.id} bill={b} />)
            ) : (
              <Card>
                <Txt muted>Nothing here in the last 30 days.</Txt>
              </Card>
            )}
          </View>

          <Card style={{ marginTop: Spacing.xl, gap: 4 }}>
            <Txt variant="label" muted>
              Civic, not partisan
            </Txt>
            <Txt variant="small" muted>
              PhillyPulse uses official sources and doesn’t endorse candidates, parties or positions. Bill summaries
              are generated automatically from official titles. Read the official text before you form an opinion.
            </Txt>
          </Card>

          <SectionTitle kicker="Before it was a dashboard" title="Where it all started" />
          <PhillyHistory />
        </>
      )}
    </Screen>
  );
}
