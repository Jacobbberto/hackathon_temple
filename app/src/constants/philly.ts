/** The culture layer: slang, chants and the voice of the app. */

export type Slang = { word: string; say: string; means: string; example: string };

export const SLANG: Slang[] = [
  { word: 'Jawn', say: 'jawn', means: 'Any person, place or thing. Philly’s all-purpose noun.', example: '“Pass me that jawn.”' },
  { word: 'Wooder', say: 'WOOD-er', means: 'Water. As in wooder ice, the only summer dessert that matters.', example: '“Grab me a wooder, it’s hot.”' },
  { word: 'Hoagie', say: 'HO-gee', means: 'A sub, a hero, a grinder: all wrong. It’s a hoagie.', example: '“Italian hoagie, extra oil.”' },
  { word: 'Jimmies', say: 'JIM-eez', means: 'Sprinkles. Chocolate ones, on your soft serve.', example: '“Vanilla cone wit jimmies.”' },
  { word: 'Youse', say: 'yooz', means: 'Plural “you.” Also “youse guys.”', example: '“Are youse coming down the shore?”' },
  { word: 'Down the shore', say: 'down tha shore', means: 'Going to the Jersey Shore. Never “to the beach.”', example: '“We’re going down the shore this weekend.”' },
  { word: 'Drawlin’', say: 'DRAW-lin', means: 'Acting out of line, being ridiculous.', example: '“Charging $9 for a pretzel? You’re drawlin’.”' },
  { word: 'Bol', say: 'bull', means: 'A guy, a dude, your friend.', example: '“That bol can’t park.”' },
  { word: 'Ard', say: 'ahrd', means: 'Alright. Agreement, goodbye, or both.', example: '“Ard, see you at the game.”' },
  { word: 'Wit / witout', say: 'wit, wit-OWT', means: 'With or without fried onions on your cheesesteak.', example: '“One whiz wit.”' },
  { word: 'Iggles', say: 'IG-gulls', means: 'The Eagles, as pronounced by your uncle.', example: '“Iggles by 10, guaranteed.”' },
  { word: 'Jeet?', say: 'JEET', means: '“Did you eat?” The answer is always a hoagie.', example: '“Jeet yet?” “No, jew?”' },
  { word: 'The El', say: 'the ell', means: 'The Market-Frankford Line. Elevated, occasionally elevating.', example: '“Take the El to 2nd.”' },
  { word: 'Schuylkill', say: 'SKOO-kul', means: 'The river, and the expressway where time stands still.', example: '“Traffic on the Schuylkill is backed up to King of Prussia.”' },
  { word: 'Gravy', say: 'GRAY-vee', means: 'Tomato sauce, if you grew up in South Philly.', example: '“Nonna’s making gravy Sunday.”' },
  { word: 'Pavement', say: 'PAYV-ment', means: 'The sidewalk. Sweep it in front of your rowhome.', example: '“Don’t park on the pavement.”' },
  { word: 'Mad', say: 'mad', means: 'Very, a lot.', example: '“It’s mad cold out.”' },
  { word: 'Acme', say: 'ACK-a-me', means: 'The grocery store. Three syllables, no exceptions.', example: '“Run to the Acme for milk.”' },
];

export const GREETINGS = {
  morning: ['Mornin’, Philly!', 'Rise and grind, jawn.', 'Yo! Coffee and a Tastykake?'],
  afternoon: ['Yo, Philly!', 'What’s the jawn today?', 'Afternoon, youse.'],
  evening: ['Evenin’, Philly.', 'Boathouse Row’s lit up.', 'Yo! Dinner plans? Hoagie.'],
  night: ['Late night, jawn?', 'Wawa run o’clock.', 'City that never sleeps (much).'],
};

export function greetingFor(hour: number, seed: number): string {
  const bucket = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
  const options = GREETINGS[bucket];
  return options[seed % options.length];
}

/** A one-liner for the weather card, in the local dialect. */
export function weatherTake(icon: string, tempF: number | null | undefined): string {
  const t = tempF ?? 60;
  if (icon === 'storm') return 'Thunder over the Delaware. Stay inside, bol.';
  if (icon === 'snow') return 'Snow! Everyone’s at the Acme for milk and bread.';
  if (icon === 'rain' || icon === 'drizzle') return 'Grab an umbrella. The El’s gonna be packed.';
  if (icon === 'fog') return 'Can’t see Billy Penn’s hat. Drive slow on the Schuylkill.';
  if (t >= 88) return 'Mad humid. Wooder ice weather, no question.';
  if (t >= 76) return 'Warm one. Perfect for a hoagie on the Art Museum steps.';
  if (t >= 60) return 'Beautiful day. Somebody’s definitely running the Rocky Steps.';
  if (t >= 45) return 'Hoodie weather. Eagles hoodie, specifically.';
  if (t >= 32) return 'Chilly! Wit or witout a coat? Wit.';
  return 'It’s mad cold. Soft pretzel hand warmers recommended.';
}

/** 0–5 cups of water ice, scientifically calibrated. */
export function wooderIceIndex(tempF: number | null | undefined): number {
  const t = tempF ?? 0;
  if (t >= 90) return 5;
  if (t >= 82) return 4;
  if (t >= 74) return 3;
  if (t >= 66) return 2;
  if (t >= 58) return 1;
  return 0;
}

export type Chant = { letters: string[]; finale: string };

export const TEAM_CHANTS: Record<string, Chant> = {
  eagles: { letters: ['E', 'A', 'G', 'L', 'E', 'S'], finale: 'EAGLES!' },
  phillies: { letters: ['RING', 'THE', 'BELL'], finale: 'RING THE BELL! 🔔' },
  sixers: { letters: ['TRUST', 'THE', 'PROCESS'], finale: 'TRUST THE PROCESS!' },
  flyers: { letters: ['LET’S', 'GO', 'FLY', 'ERS'], finale: 'LET’S GO FLYERS!' },
  union: { letters: ['D', 'O', 'O', 'P'], finale: 'DOOP! DOOP! DOOP!' },
  temple: { letters: ['T', 'U'], finale: 'GO OWLS! 🦉' },
};

export const LOADING_LINES = [
  'Whiz wit’, comin’ right up…',
  'Merging onto the Schuylkill… this could take a minute.',
  'Waiting on the 17 bus…',
  'Asking the guy at Wawa…',
  'Greasing the light poles…',
  'Running up the Art Museum steps…',
  'Checking if Gritty approves…',
];

export const EMPTY_LINES = {
  live: 'Nobody’s playing right now. Grab a cheesesteak and check back.',
  upcoming: 'Nothing on the schedule this week. Rest those vocal cords.',
  recent: 'No recent games. The off-season is a state of mind.',
};

/** Billy Penn gets dressed up for playoff runs. Tap him on the skyline to cycle jerseys. */
export const BILLY_PENN_OUTFITS: { team: string; color: string; accent: string; line: string }[] = [
  { team: 'eagles', color: '#004C54', accent: '#A5ACAF', line: 'Billy Penn’s repping the Birds. Go Birds!' },
  { team: 'phillies', color: '#E81828', accent: '#002D72', line: 'Red October on the City Hall tower!' },
  { team: 'sixers', color: '#006BB6', accent: '#ED174C', line: 'Billy Penn trusts the process.' },
  { team: 'flyers', color: '#F74902', accent: '#111111', line: 'Orange and black on Broad Street!' },
  { team: 'union', color: '#071B2C', accent: '#B19B69', line: 'DOOP! Billy’s in Union blue.' },
  { team: 'temple', color: '#9D2235', accent: '#FFFFFF', line: 'Cherry and white. Temple Made!' },
  { team: 'bronze', color: '#8C6A3F', accent: '#5E4527', line: 'Back to bronze. The Curse of Billy Penn: lifted in 2008.' },
];
