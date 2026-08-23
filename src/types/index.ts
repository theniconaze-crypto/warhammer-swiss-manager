/**
 * src/types/index.ts
 * Central TypeScript type definitions for the Warhammer Tournament Manager.
 * All interfaces and types used across the application are declared here.
 */

export type GameSystem = 'AOS' | 'W40K';

export type TournamentFormat = 'SOLO' | 'TEAM';

export type TeamSize = 4 | 6 | 8;

export type TournamentStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

export type RoundStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TiebreakerType =
  | 'BUCHHOLZ'
  | 'SOS'
  | 'VP_DIFF'
  | 'VP_TOTAL'
  | 'HEAD_TO_HEAD'
  | 'PAINTING'
  | 'SPORTSMANSHIP';

export type MatchResult = 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | 'BYE';

export type SubMatchResult = 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW';

export interface TournamentRules {
  maxRounds: number;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  usePaintingScore: boolean;
  useSportsmanshipScore: boolean;
  tiebreakerOrder: TiebreakerType[];
  defaultTimerMinutes: number;
  allowDrops: boolean;
  byePoints: number;
  maxVP: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  faction: string;
  subfaction?: string;
  teamId?: string;
  painting?: number;
  sportsmanship?: number;
  dropped: boolean;
  listSubmitted?: boolean;
  notes?: string;
  armyList?: string;
  seed?: number;
  checkedIn?: boolean;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  captain?: string;
}

export interface SubPairing {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score?: number;
  player2Score?: number;
  result?: SubMatchResult;
}

export interface Pairing {
  id: string;
  table: number;
  player1Id: string;
  player2Id: string | 'BYE';
  player1Score?: number;
  player2Score?: number;
  player1BattlePoints?: number;
  player2BattlePoints?: number;
  result?: MatchResult;
  player1Sportsmanship?: number;
  player2Sportsmanship?: number;
  locked: boolean;
  subPairings?: SubPairing[];
  missionId?: string;
  tableName?: string;
}

export interface Round {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  pairings: Pairing[];
  startTime?: string;
  endTime?: string;
  timerDuration: number;
  missionPool?: string[];
}

export interface Mission {
  id: string;
  name: string;
  gameSystem: GameSystem;
  source: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'pairing' | 'round' | 'player' | 'tournament';
  entityId: string;
  previousValue?: string;
  newValue?: string;
  userId?: string;
}

export interface PrizeCategory {
  id: string;
  name: string;
  description?: string;
  type: 'RANK' | 'FACTION' | 'PAINTING' | 'SPORTSMANSHIP' | 'GENERAL';
  winnerId?: string;
  winnerTeamId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  gameSystem: GameSystem;
  format: TournamentFormat;
  teamSize?: TeamSize;
  pointsLimit: number;
  numberOfRounds: number;
  currentRound: number;
  status: TournamentStatus;
  players: Player[];
  teams?: Team[];
  rounds: Round[];
  rules: TournamentRules;
  prizes?: PrizeCategory[];
  auditLog?: AuditLog[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  location?: string;
  organizer?: string;
  checksum?: string;
}

export interface StandingEntry {
  rank: number;
  playerId: string;
  teamId?: string;
  matchPoints: number;
  wins: number;
  draws: number;
  losses: number;
  byes: number;
  vpScored: number;
  vpConceded: number;
  vpDiff: number;
  buchholz: number;
  sos: number;
  paintingScore: number;
  sportsmanshipTotal: number;
  opponents: string[];
  dropped: boolean;
  winRate: number;
}

export interface TeamStandingEntry {
  rank: number;
  teamId: string;
  teamName: string;
  matchPoints: number;
  wins: number;
  draws: number;
  losses: number;
  playerPoints: number;
  buchholz: number;
  sos: number;
  opponents: string[];
}

export interface GlobalPlayerRecord {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  tournamentIds: string[];
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalVPScored: number;
  totalVPConceded: number;
  factionsPlayed: string[];
  averageRank: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: 'fr' | 'en';
  theme: 'dark' | 'warhammer' | 'sigmar' | 'imperium';
  hapticFeedback: boolean;
  soundEnabled: boolean;
  defaultTimerMinutes: number;
  defaultWinPoints: number;
  defaultDrawPoints: number;
  defaultLossPoints: number;
  defaultMaxVP: number;
  showConfirmDialogs: boolean;
  autoLockResults: boolean;
}

export type InternalPairingMode = 'RANDOM' | 'RANK' | 'CHAMPION_SELECT';

export interface FactionInfo {
  id: string;
  name: string;
  gameSystem: GameSystem;
  alliance?: string;
  subfactions?: string[];
}

// W40K Factions
export const W40K_FACTIONS: FactionInfo[] = [
  { id: 'space-marines', name: 'Space Marines', gameSystem: 'W40K', alliance: 'Imperium', subfactions: ['Ultramarines', 'Imperial Fists', 'Iron Hands', 'Salamanders', 'Raven Guard', 'White Scars', 'Iron Warriors', 'Alpha Legion'] },
  { id: 'blood-angels', name: 'Blood Angels', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'dark-angels', name: 'Dark Angels', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'black-templars', name: 'Black Templars', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'space-wolves', name: 'Space Wolves', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'deathwatch', name: 'Deathwatch', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'grey-knights', name: 'Grey Knights', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'astra-militarum', name: 'Astra Militarum', gameSystem: 'W40K', alliance: 'Imperium', subfactions: ['Cadian', 'Catachan', 'Valhallan', 'Steel Legion', 'Death Korps of Krieg'] },
  { id: 'adeptus-mechanicus', name: 'Adeptus Mechanicus', gameSystem: 'W40K', alliance: 'Imperium', subfactions: ['Stygies VIII', 'Metalica', 'Graia', 'Mars', 'Ryza'] },
  { id: 'adeptus-custodes', name: 'Adeptus Custodes', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'adepta-sororitas', name: 'Adepta Sororitas', gameSystem: 'W40K', alliance: 'Imperium', subfactions: ['Order of Our Martyred Lady', 'Order of the Bloody Rose', 'Order of the Sacred Rose', 'Order of the Argent Shroud', 'Order of the Valorous Heart', 'Order of the Ebon Chalice'] },
  { id: 'imperial-knights', name: 'Imperial Knights', gameSystem: 'W40K', alliance: 'Imperium' },
  { id: 'chaos-space-marines', name: 'Chaos Space Marines', gameSystem: 'W40K', alliance: 'Chaos', subfactions: ['Black Legion', 'Iron Warriors', 'Alpha Legion', "Emperor's Children", 'Night Lords', 'Word Bearers'] },
  { id: 'death-guard', name: 'Death Guard', gameSystem: 'W40K', alliance: 'Chaos' },
  { id: 'thousand-sons', name: 'Thousand Sons', gameSystem: 'W40K', alliance: 'Chaos' },
  { id: 'world-eaters', name: 'World Eaters', gameSystem: 'W40K', alliance: 'Chaos' },
  { id: 'chaos-daemons', name: 'Chaos Daemons', gameSystem: 'W40K', alliance: 'Chaos', subfactions: ['Tzeentch', 'Nurgle', 'Khorne', 'Slaanesh', 'Undivided'] },
  { id: 'chaos-knights', name: 'Chaos Knights', gameSystem: 'W40K', alliance: 'Chaos' },
  { id: 'orks', name: 'Orks', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Goffs', 'Evil Sunz', "Bad Moons", "Deathskulls", "Blood Axes", "Snake Bites"] },
  { id: 'tau-empire', name: "T'au Empire", gameSystem: 'W40K', alliance: 'Xenos', subfactions: ["Dal'yth", "Farsight Enclaves", "Bork'an", "Vior'la", "Sa'cea"] },
  { id: 'aeldari', name: 'Aeldari (Craftworlds)', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Ulthwé', 'Iyanden', 'Saim-Hann', 'Alaitoc', 'Biel-Tan'] },
  { id: 'drukhari', name: 'Drukhari', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Kabal of the Black Heart', 'Kabal of the Flayed Skull', 'Wych Cult of Strife', 'Coven of Twelve'] },
  { id: 'harlequins', name: 'Harlequins', gameSystem: 'W40K', alliance: 'Xenos' },
  { id: 'ynnari', name: 'Ynnari', gameSystem: 'W40K', alliance: 'Xenos' },
  { id: 'tyranids', name: 'Tyranids', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Hive Fleet Leviathan', 'Hive Fleet Behemoth', 'Hive Fleet Kraken', 'Hive Fleet Kronos', 'Hive Fleet Hydra', 'Hive Fleet Gorgon'] },
  { id: 'genestealer-cults', name: 'Genestealer Cults', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Bladed Cog', 'Rusted Claw', "Pauper Princes", 'Twisted Helix', 'Wyrm Cult', "Hivecult"] },
  { id: 'necrons', name: 'Necrons', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ['Szarekhan', 'Mephrit', 'Nihilakh', 'Nephrekh', 'Novokh', 'Sautekh'] },
  { id: 'leagues-of-votann', name: 'Leagues of Votann', gameSystem: 'W40K', alliance: 'Xenos', subfactions: ["Kin of the Eye", 'Kronus Hegemony', 'Trans-Hyperian Alliance', 'Ymyr Conglomerate', "Urani-Surtr Regulates"] },
  { id: 'agents-imperium', name: 'Agents of the Imperium', gameSystem: 'W40K', alliance: 'Imperium' },
];

// AoS Factions
export const AOS_FACTIONS: FactionInfo[] = [
  { id: 'stormcast-eternals', name: 'Stormcast Eternals', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Hammers of Sigmar', 'Celestial Vindicators', 'Knights Excelsior', 'Anvils of the Heldenhammer', 'Tempest Lords', 'Astral Templars'] },
  { id: 'cities-of-sigmar', name: 'Cities of Sigmar', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Hammerhal', 'Greywater Fastness', 'The Living City', 'Phoenicium', 'Anvilgard', 'Hallowheart'] },
  { id: 'fyreslayers', name: 'Fyreslayers', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Vostarg', 'Greyfyrd', 'Hermdar', 'Lofnir', 'Spiteclaw'] },
  { id: 'kharadron-overlords', name: 'Kharadron Overlords', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Barak-Nar', 'Barak-Zilfin', 'Barak-Zon', 'Barak-Urbaz', 'Barak-Mhornar', 'Barak-Thryng'] },
  { id: 'lumineth-realm-lords', name: 'Lumineth Realm-lords', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Syar', 'Iliatha', 'Zaitrec', 'Alumnia', 'Helon', 'Ymetrica'] },
  { id: 'idoneth-deepkin', name: 'Idoneth Deepkin', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Ionrach', 'Dhom-hain', 'Fuethan', "Mor'phann", 'Nautilar', 'Briomdar'] },
  { id: 'sylvaneth', name: 'Sylvaneth', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Oakenbrow', 'Gnarlroot', 'Heartwood', 'Ironbark', 'Winterleaf', 'Dreadwood', 'Harvestboon'] },
  { id: 'daughters-of-khaine', name: 'Daughters of Khaine', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Hagg Nar', 'Draichi Ganeth', 'The Kraith', 'Khailebron', 'Khelt Nar'] },
  { id: 'seraphon', name: 'Seraphon', gameSystem: 'AOS', alliance: 'Order', subfactions: ['Coalesced', 'Starborne', 'Thunder Lizard', 'Fangs of Sotek', "Dracothion's Tail", "Koatl's Claw", 'Scales of Talaxis'] },
  { id: 'slaves-to-darkness', name: 'Slaves to Darkness', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Ravagers', 'Cabalists', 'Despoilers', 'Host of the Everchosen', 'Eternals of Chaos'] },
  { id: 'blades-of-khorne', name: 'Blades of Khorne', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ["Reapers of Vengeance", 'Bloodlords', 'Goretide', 'Skullfiend Tribe', 'The Flayed'] },
  { id: 'disciples-of-tzeentch', name: 'Disciples of Tzeentch', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Eternal Conflagration', 'Hosts Duplicitous', 'Hosts of the True Change', 'Cult of the Transient Form', 'Pyrofane Cult', 'Guild of Summoners'] },
  { id: 'maggotkin-of-nurgle', name: 'Maggotkin of Nurgle', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Munificent Wanderers', 'Drowned Men', 'The Blessed Sons', 'Befouling Host', 'Filthbringers'] },
  { id: 'hedonites-of-slaanesh', name: 'Hedonites of Slaanesh', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Invaders Host', 'Pretenders Host', 'Lurid Haze Invaders', 'Scarlet Cavalcade', "Faultless Blades", 'Wheels of Excruciation'] },
  { id: 'skaven', name: 'Skaven', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Clans Verminus', 'Clans Eshin', 'Clans Moulder', 'Clans Skryre', 'Clans Pestilens'] },
  { id: 'beasts-of-chaos', name: 'Beasts of Chaos', gameSystem: 'AOS', alliance: 'Chaos', subfactions: ['Allherd', 'Darkwalkers', 'Gavespawn'] },
  { id: 'flesh-eater-courts', name: 'Flesh-eater Courts', gameSystem: 'AOS', alliance: 'Death', subfactions: ['Morgaunt', 'Hollowmourne', 'Blisterskin', 'Gristlegore'] },
  { id: 'nighthaunt', name: 'Nighthaunt', gameSystem: 'AOS', alliance: 'Death', subfactions: ['Emerald Host', "Reikenor's Condemned", 'Dolorous Guard', 'The Quickening Sorrow', 'Shrieker Host', 'Scarlet Doom', 'Death', 'The Condemned'] },
  { id: 'ossiarch-bonereapers', name: 'Ossiarch Bonereapers', gameSystem: 'AOS', alliance: 'Death', subfactions: ['Mortis Praetorians', 'Petrifex Elite', 'Stalliarch Lords', 'Ivory Host', 'Null Myriad', 'Crematorians'] },
  { id: 'soulblight-gravelords', name: 'Soulblight Gravelords', gameSystem: 'AOS', alliance: 'Death', subfactions: ['Legion of Blood', 'Legion of Night', 'Vyrkos Dynasty', 'Kastelai Dynasty', 'Avengorii Dynasty', 'Crimson Court'] },
  { id: 'ogor-mawtribes', name: 'Ogor Mawtribes', gameSystem: 'AOS', alliance: 'Destruction', subfactions: ['Bloodgullet', 'Underguts', 'Boulderhead', 'Thunderbellies', 'Winterbite', 'Meat-fisted Gorgers'] },
  { id: 'gloomspite-gitz', name: 'Gloomspite Gitz', gameSystem: 'AOS', alliance: 'Destruction', subfactions: ['Jaws of Mork', "Glogg's Megamob", 'Grimscuttle Tribes', 'Gitz of the Bad Moon'] },
  { id: 'orruk-warclans', name: 'Orruk Warclans', gameSystem: 'AOS', alliance: 'Destruction', subfactions: ['Ironsunz', 'Bloodtoofs', "Da Choppas", 'Kryptboyz', "Boulderhead Brawlers", 'Big Waaagh!', 'Ironjawz', 'Bonesplitterz'] },
  { id: 'sons-of-behemat', name: 'Sons of Behemat', gameSystem: 'AOS', alliance: 'Destruction', subfactions: ['Taker Tribe', 'Stomper Tribe', 'Breaker Tribe', 'Marauder Tribe'] },
];

export function getFactionsForSystem(system: GameSystem): FactionInfo[] {
  return system === 'W40K' ? W40K_FACTIONS : AOS_FACTIONS;
}

export function getFactionById(id: string, system: GameSystem): FactionInfo | undefined {
  return getFactionsForSystem(system).find(f => f.id === id);
}

export function getFactionName(id: string, system: GameSystem): string {
  const faction = getFactionById(id, system);
  return faction?.name ?? id;
}
