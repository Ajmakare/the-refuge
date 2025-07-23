export interface PlayerStats {
  uuid: string;
  name: string;
  playtime: number;
  sessions: number;
  kills: {
    mob: number;
    player: number;
  };
  deaths: number;
  lastSeen: string;
  joinDate: string;
  // Optional additional stats for specialized leaderboards
  avgPing?: number;
  pingRecords?: number;
  survivalTime?: number;
  creativeTime?: number;
  adventureTime?: number;
  afkTime?: number;
  rank?: string; // Player rank from LuckPerms
  activityScore?: number; // Internal activity calculation for sorting
}

export interface DiscordPlayer {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  xp: number;
  level: number;
  message_count: number;
  detailed_xp: [number, number, number]; // [current_level_xp, xp_needed_for_next, total_xp]
}

export interface DiscordLeaderboardData {
  players: DiscordPlayer[];
  guild: {
    id: string;
    name: string;
    icon: string;
  };
  lastUpdated: string;
}

export interface LeaderboardData {
  mostActive: PlayerStats[];
  topKillers: PlayerStats[];
  mostDeaths: PlayerStats[];
  discord?: DiscordPlayer[];
  lastUpdated: string;
}

export interface ServerStats {
  totalPlayers: number;
  activeToday: number;
  totalPlaytime: number;
  onlineNow: number;
}