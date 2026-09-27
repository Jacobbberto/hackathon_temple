/** Philly History 101: the civic highlights, shown at the bottom of the Politics tab. */

export type HistoryEntry = { year: string; title: string; text: string; emoji: string };

export const PHILLY_HISTORY: HistoryEntry[] = [
  {
    year: '1682',
    emoji: '🗺️',
    title: 'Penn lays out the “greene Country Towne”',
    text: 'William Penn founds Philadelphia (Greek for “brotherly love”) and plans a street grid between the Delaware and the Schuylkill with five public squares. Four are now Rittenhouse, Washington and Franklin Squares and Logan Circle; City Hall sits on the fifth.',
  },
  {
    year: '1751',
    emoji: '🏥',
    title: 'The nation’s first hospital',
    text: 'Benjamin Franklin and Dr. Thomas Bond found Pennsylvania Hospital, which still treats patients today.',
  },
  {
    year: '1752',
    emoji: '🔔',
    title: 'The bell arrives, and cracks',
    text: 'The State House bell cracks on its first test ring. Local metalworkers John Pass and John Stow recast it right here in Philly. Abolitionists later named it the Liberty Bell.',
  },
  {
    year: '1776',
    emoji: '📜',
    title: 'Independence',
    text: 'The Second Continental Congress adopts the Declaration of Independence at the Pennsylvania State House, now Independence Hall. It’s read aloud to the public in the State House Yard on July 8.',
  },
  {
    year: '1787',
    emoji: '⚖️',
    title: 'The Constitution',
    text: 'Delegates spend the summer at Independence Hall drafting the U.S. Constitution.',
  },
  {
    year: '1790–1800',
    emoji: '🏛️',
    title: 'The nation’s capital',
    text: 'Philadelphia serves as the capital of the United States while Washington, D.C. is built. The first U.S. Mint opens here in 1792.',
  },
  {
    year: '1794',
    emoji: '⛪',
    title: 'Mother Bethel',
    text: 'Richard Allen founds Mother Bethel A.M.E. Church, the mother church of the African Methodist Episcopal denomination, on land in Society Hill still owned by the congregation.',
  },
  {
    year: '1854',
    emoji: '🧩',
    title: 'City and county become one',
    text: 'The Act of Consolidation merges the city with every township and borough in Philadelphia County. That’s why Philly is both a city and a county today.',
  },
  {
    year: '1876',
    emoji: '🎡',
    title: 'The Centennial Exhibition',
    text: 'The first official World’s Fair in the U.S. takes over Fairmount Park to celebrate 100 years of independence.',
  },
  {
    year: '1901',
    emoji: '🪶',
    title: 'City Hall and the Mummers',
    text: 'City Hall is finished after three decades of construction, topped by a 37-foot bronze William Penn. The same New Year’s Day, the Mummers Parade becomes an official city event.',
  },
  {
    year: '1976',
    emoji: '🥊',
    title: 'Rocky runs the steps',
    text: 'Rocky hits theaters, and the Art Museum’s east entrance steps become the most famous staircase in America.',
  },
  {
    year: '1987',
    emoji: '🏙️',
    title: 'The Curse of Billy Penn',
    text: 'One Liberty Place breaks the gentlemen’s agreement that nothing rises above Penn’s hat. Local teams go title-less until a Penn statuette is placed atop the Comcast Center in 2007. The Phillies win the 2008 World Series.',
  },
  {
    year: '2018',
    emoji: '🦅',
    title: 'The Philly Special',
    text: 'The Eagles win Super Bowl LII, their first, sealed with the trick play this hackathon track is named after. They win again in Super Bowl LIX in 2025.',
  },
];

/** How local government works, in one breath each. */
export const CIVICS_FACTS = [
  'City Council has 17 members: 10 elected by district and 7 elected at-large, citywide.',
  'Council’s stated meetings are open to the public, usually Thursday mornings in Room 400 of City Hall.',
  'Because the city and county are one, the Mayor and Council also handle what counties do elsewhere.',
  'Philadelphia’s three City Commissioners run elections here, not a separate county board.',
];
