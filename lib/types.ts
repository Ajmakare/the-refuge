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

export interface LeaderboardData {
  mostActive: PlayerStats[];
  topKillers: PlayerStats[];
  mostDeaths: PlayerStats[];
  lastUpdated: string;
}

export interface ServerStats {
  totalPlayers: number;
  activeToday: number;
  totalPlaytime: number;
  onlineNow: number;
}