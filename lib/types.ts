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
  blocksPlaced: number;
  blocksBroken: number;
  lastSeen: string;
  joinDate: string;
}

export interface LeaderboardData {
  mostActive: PlayerStats[];
  topKillers: PlayerStats[];
  longestSessions: PlayerStats[];
  topBuilders: PlayerStats[];
  lastUpdated: string;
}

export interface ServerStats {
  totalPlayers: number;
  activeToday: number;
  totalPlaytime: number;
  onlineNow: number;
}