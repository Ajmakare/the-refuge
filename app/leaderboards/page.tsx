"use client";

import { Trophy, Clock, Sword, Home, Crown, Star, Info } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LeaderboardData, PlayerStats } from "@/lib/types";
import { formatPlaytime, formatNumber, formatDate, formatDateTime, formatRank, getRankColor as getPlayerRankColor } from "@/lib/utils";


export default function Leaderboards() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'killers' | 'deaths'>('active');
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);


  useEffect(() => {
    // Fetch real leaderboards data
    fetch('/api/leaderboards')
      .then(res => res.json())
      .then((data: LeaderboardData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Setup scroll animations after data loads
    if (!data) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const elementsToAnimate = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right');
      elementsToAnimate.forEach((el) => observer.observe(el));
      
      // Fallback: force animation after a short delay if intersection observer doesn't work
      setTimeout(() => {
        elementsToAnimate.forEach((el) => {
          if (!el.classList.contains('animate-in')) {
            el.classList.add('animate-in');
          }
        });
      }, 500);
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [data]);

  // Close info tooltip when clicking outside
  useEffect(() => {
    if (!showInfo) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.info-tooltip-container')) {
        setShowInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfo]);

  // Helper function to merge all player data consistently
  const mergeAllPlayerData = (): Map<string, PlayerStats> => {
    if (!data) return new Map();
    
    const playerMap = new Map<string, PlayerStats>();
    
    // Helper function to merge player data with priority-based field selection
    const mergePlayer = (uuid: string, newData: PlayerStats) => {
      const existing = playerMap.get(uuid);
      if (!existing) {
        playerMap.set(uuid, { 
          ...newData, 
          kills: newData.kills || { mob: 0, player: 0 }
        });
        return;
      }
      
      // Merge with intelligent field prioritization
      const merged: PlayerStats = {
        uuid: existing.uuid,
        name: existing.name,
        // Always use the best available data for each field
        playtime: Math.max(existing.playtime || 0, newData.playtime || 0),
        sessions: Math.max(existing.sessions || 0, newData.sessions || 0),
        kills: {
          mob: Math.max(existing.kills?.mob || 0, newData.kills?.mob || 0),
          player: Math.max(existing.kills?.player || 0, newData.kills?.player || 0)
        },
        deaths: Math.max(existing.deaths || 0, newData.deaths || 0),
        afkTime: Math.max(existing.afkTime || 0, newData.afkTime || 0),
        rank: existing.rank || newData.rank,
        activityScore: Math.max(existing.activityScore || 0, newData.activityScore || 0),
        // Use most recent timestamps
        lastSeen: new Date(existing.lastSeen).getTime() > new Date(newData.lastSeen).getTime() ? 
                 existing.lastSeen : newData.lastSeen,
        joinDate: new Date(existing.joinDate).getTime() < new Date(newData.joinDate).getTime() ? 
                 existing.joinDate : newData.joinDate
      };
      
      playerMap.set(uuid, merged);
    };
    
    // Merge data from all leaderboard sources
    data.mostActive.forEach(player => mergePlayer(player.uuid, player));
    data.topKillers.forEach(player => mergePlayer(player.uuid, player));
    data.mostDeaths.forEach(player => mergePlayer(player.uuid, player));
    
    return playerMap;
  };

  // Get the actual #1 players for each category (matches what's shown in leaderboards)
  const getTopPlayers = () => {
    const completePlayerData = mergeAllPlayerData();
    const allPlayers = Array.from(completePlayerData.values());
    
    const mostActive = allPlayers
      .filter(p => p.playtime > 0)
      .sort((a, b) => {
        const scoreA = a.activityScore || a.playtime;
        const scoreB = b.activityScore || b.playtime;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      })[0];
      
    const topKiller = allPlayers
      .filter(p => (p.kills.mob + p.kills.player) > 0)
      .sort((a, b) => (b.kills.mob + b.kills.player) - (a.kills.mob + a.kills.player))[0];
      
    const mostDeaths = allPlayers
      .filter(p => p.deaths > 0)
      .sort((a, b) => b.deaths - a.deaths)[0];
      
    return { mostActive, topKiller, mostDeaths };
  };

  const getActiveData = (): PlayerStats[] => {
    const completePlayerData = mergeAllPlayerData();
    const allPlayers = Array.from(completePlayerData.values());
    
    let result: PlayerStats[];
    switch (activeTab) {
      case 'active': 
        // Sort by activity score (if available) then by playtime
        result = allPlayers
          .filter(p => p.playtime > 0)
          .sort((a, b) => {
            const scoreA = a.activityScore || a.playtime;
            const scoreB = b.activityScore || b.playtime;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
          });
        break;
      case 'killers': 
        result = allPlayers
          .filter(p => (p.kills.mob + p.kills.player) > 0)
          .sort((a, b) => (b.kills.mob + b.kills.player) - (a.kills.mob + a.kills.player));
        break;
      case 'deaths':
        result = allPlayers
          .filter(p => p.deaths > 0)
          .sort((a, b) => b.deaths - a.deaths);
        break;
      default: 
        result = [];
    }
    
    return (result || []).slice(0, 10);
  };

  const getTabConfig = (tab: string) => {
    switch (tab) {
      case 'active': 
        return { 
          icon: <Clock style={{ width: "20px", height: "20px" }} />, 
          title: 'Most Active Players',
          description: 'Players ranked by recent activity in the last 14 days'
        };
      case 'killers': 
        return { 
          icon: <Sword style={{ width: "20px", height: "20px" }} />, 
          title: 'Top Combat Players',
          description: 'Players with the most mob and PvP kills'
        };
      case 'deaths':
        return {
          icon: <Trophy style={{ width: "20px", height: "20px" }} />,
          title: 'Most Deaths',
          description: 'Players who have died the most (learning experiences!)'
        };
      default: 
        return { 
          icon: <Clock style={{ width: "20px", height: "20px" }} />, 
          title: 'Most Active Players',
          description: 'Players with the highest total playtime'
        };
    }
  };

  const PlayerCard = ({ player, rank }: { player: PlayerStats; rank: number }) => {
    const getRankIcon = (rank: number) => {
      if (rank === 1) return <Crown style={{ width: "24px", height: "24px", color: "#FFD700" }} />;
      if (rank === 2) return <Star style={{ width: "24px", height: "24px", color: "#C0C0C0" }} />;
      if (rank === 3) return <Trophy style={{ width: "24px", height: "24px", color: "#D2691E" }} />;
      return <span style={{ color: "white", fontSize: "18px", fontWeight: "600" }}>#{rank}</span>;
    };

    const getRankColor = (rank: number) => {
      if (rank === 1) return "linear-gradient(135deg, #FFD700, #FFA500)";
      if (rank === 2) return "linear-gradient(135deg, #C0C0C0, #A0A0A0)";
      if (rank === 3) return "linear-gradient(135deg, #D2691E, #A0522D)";
      return "var(--primary)";
    };

    const getDisplayStat = () => {
      switch (activeTab) {
        case 'active': 
          return { 
            value: player.playtime > 0 ? formatPlaytime(player.playtime) : 'New Player', 
            label: player.playtime > 0 ? 'Playtime' : 'Just Joined' 
          };
        case 'killers': 
          return { 
            value: formatNumber(player.kills.mob + player.kills.player), 
            label: 'Total Kills' 
          };
        case 'deaths':
          return {
            value: player.deaths > 0 ? formatNumber(player.deaths) : '0',
            label: 'Deaths'
          };
        default: 
          return { 
            value: player.playtime > 0 ? formatPlaytime(player.playtime) : 'New Player', 
            label: player.playtime > 0 ? 'Playtime' : 'Just Joined' 
          };
      }
    };

    const displayStat = getDisplayStat();

    return (
      <div className="minecraft-card" style={{ 
        marginBottom: '16px',
        background: rank <= 3 ? 'rgba(255, 255, 255, 0.12)' : 'var(--glass-bg)',
        border: rank <= 3 ? '2px solid ' + (rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#D2691E') : '1px solid var(--glass-border)',
        opacity: 1,
        transform: 'translateY(0)'
      }}>
        <style jsx>{`
          @media (min-width: 769px) {
            .desktop-layout { display: block !important; }
            .mobile-layout { display: none !important; }
          }
          @media (max-width: 768px) {
            .desktop-layout { display: none !important; }
            .mobile-layout { display: flex !important; }
          }
        `}</style>
        <div className="player-card" style={{ 
          display: 'flex', 
          alignItems: 'stretch', 
          justifyContent: 'space-between', 
          flexDirection: 'column', 
          gap: '12px'
        }}>
          {/* Desktop Layout - Player Info + Stat Inline */}
          <div className="desktop-layout" style={{ display: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: getRankColor(rank),
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0
                }}>
                  <div style={{ transform: 'scale(0.8)' }}>
                    {getRankIcon(rank)}
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  flexShrink: 0
                }}>
                  <img 
                    src={'https://mc-heads.net/avatar/' + player.name + '/56'}
                    alt={player.name + "'s Minecraft head"}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      // Fallback to initial if avatar fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'white',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: 'white',
                    marginBottom: '2px',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: '1.2',
                    wordBreak: 'break-word'
                  }}>
                    {player.name}
                  </h3>
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: '1.2',
                    wordBreak: 'break-word'
                  }}>
                    Joined {formatDate(player.joinDate)}
                  </p>
                </div>
              </div>
              
              {/* Primary Stat - Inline on Desktop */}
              <div style={{ 
                textAlign: 'center',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                flexShrink: 0,
                minWidth: '80px'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: 'var(--primary)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.2'
                }}>
                  {displayStat.value}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                  {displayStat.label}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Player Info + Stat Separate */}
          <div className="mobile-layout" style={{ display: 'none', flexDirection: 'column', paddingLeft: '15px' }}>
            {/* Player Info Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: getRankColor(rank),
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                flexShrink: 0
              }}>
                <div style={{ transform: 'scale(0.8)' }}>
                  {getRankIcon(rank)}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                flexShrink: 0
              }}>
                <img 
                  src={'https://mc-heads.net/avatar/' + player.name + '/56'}
                  alt={player.name + "'s Minecraft head"}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    // Fallback to initial if avatar fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: 'white',
                  marginBottom: '2px',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.2',
                  wordBreak: 'break-word'
                }}>
                  {player.name}
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.2',
                  wordBreak: 'break-word'
                }}>
                  Joined {formatDate(player.joinDate)}
                </p>
              </div>
            </div>
            
            {/* Primary Stat - Perfectly Centered on Mobile */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              margin: '0',
              padding: '0',
              boxSizing: 'border-box'
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                width: '160px',
                margin: '0 auto',
                boxSizing: 'border-box'
              }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '700',
                color: 'var(--primary)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {displayStat.value}
              </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                  {displayStat.label}
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Stats Grid */}
          <div className="player-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: getPlayerRankColor(player.rank),
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {formatRank(player.rank)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                Rank
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: player.kills.mob > 0 ? 'var(--success)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {formatNumber(player.kills.mob)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                Mob
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: player.kills.player > 0 ? 'var(--error)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {formatNumber(player.kills.player)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                PvP
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: player.sessions > 0 ? 'var(--warning)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {player.sessions}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                Sessions
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.2'
              }}>
                {formatDate(player.lastSeen)}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                Last Seen
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100dvh", // Dynamic viewport height for mobile (fallback: 100vh)
        position: 'relative',
        paddingTop: 'env(safe-area-inset-top)', // iPhone dynamic island support
        paddingBottom: 'env(safe-area-inset-bottom)', // iPhone home indicator support
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Fixed background layer - extends beyond safe areas */}
        <div style={{
          position: 'fixed',
          top: 'calc(0px - env(safe-area-inset-top))',
          left: 'calc(0px - env(safe-area-inset-left))',
          right: 'calc(0px - env(safe-area-inset-right))',
          bottom: 'calc(0px - env(safe-area-inset-bottom))',
          width: 'calc(100vw + env(safe-area-inset-left) + env(safe-area-inset-right))',
          height: 'calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom))',
          backgroundImage: `url('/images/minecraft_bg.avif')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
          zIndex: -2
        }} />
        
        {/* Background overlay - extends beyond safe areas */}
        <div style={{
          position: 'fixed',
          top: 'calc(0px - env(safe-area-inset-top))',
          left: 'calc(0px - env(safe-area-inset-left))',
          right: 'calc(0px - env(safe-area-inset-right))',
          bottom: 'calc(0px - env(safe-area-inset-bottom))',
          width: 'calc(100vw + env(safe-area-inset-left) + env(safe-area-inset-right))',
          height: 'calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom))',
          background: `linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))`,
          zIndex: -1
        }} />
        
        <div className="minecraft-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
          }}>
            Loading Leaderboards...
          </h2>
          <div style={{ 
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
            fontSize: '32px'
          }}>
            ⚡
          </div>
        </div>
      </div>
    );
  }

  const currentTab = getTabConfig(activeTab);

  return (
    <div style={{ 
      minHeight: "100dvh", // Dynamic viewport height for mobile (fallback: 100vh)
      position: 'relative',
      paddingTop: 'env(safe-area-inset-top)', // iPhone dynamic island support
      paddingBottom: 'env(safe-area-inset-bottom)', // iPhone home indicator support
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)'
    }}>
      {/* Fixed background layer - extends beyond safe areas */}
      <div style={{
        position: 'fixed',
        top: 'calc(0px - env(safe-area-inset-top))',
        left: 'calc(0px - env(safe-area-inset-left))',
        right: 'calc(0px - env(safe-area-inset-right))',
        bottom: 'calc(0px - env(safe-area-inset-bottom))',
        width: 'calc(100vw + env(safe-area-inset-left) + env(safe-area-inset-right))',
        height: 'calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom))',
        backgroundImage: `url('/images/minecraft_bg.avif')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)',
        zIndex: -2
      }} />
      
      {/* Background overlay - extends beyond safe areas */}
      <div style={{
        position: 'fixed',
        top: 'calc(0px - env(safe-area-inset-top))',
        left: 'calc(0px - env(safe-area-inset-left))',
        right: 'calc(0px - env(safe-area-inset-right))',
        bottom: 'calc(0px - env(safe-area-inset-bottom))',
        width: 'calc(100vw + env(safe-area-inset-left) + env(safe-area-inset-right))',
        height: 'calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom))',
        background: `linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))`,
        zIndex: -1
      }} />


      {/* Main Content Container */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ 
          padding: '40px 32px 0 32px', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          flex: '1' 
        }}>
          {/* Navigation inside content */}
          <div style={{ textAlign: 'right', marginBottom: '32px' }}>
            <Link href="/" className="modern-button secondary">
              <Home style={{ width: "16px", height: "16px" }} />
              Home
            </Link>
          </div>

          {/* Header Section */}
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h1 style={{ 
              fontSize: 'clamp(48px, 8vw, 80px)', 
              fontWeight: '800',
              color: 'white',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em'
            }}>
              Leaderboards
            </h1>
            <p style={{ 
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, sans-serif',
              maxWidth: '600px',
              margin: '0 auto 24px auto'
            }}>
              See who&apos;s leading The Refuge community
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="slide-up" style={{ marginBottom: '48px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '12px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              {[
                { key: 'active' as const, label: 'Most Active' },
                { key: 'killers' as const, label: 'Top Combat' },
                { key: 'deaths' as const, label: 'Most Deaths' },
              ].map(tab => {
                const config = getTabConfig(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={activeTab === tab.key ? "modern-button primary" : "modern-button secondary"}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      padding: '16px 24px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {config.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="leaderboard-content" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'start', marginBottom: '80px' }}>
            {/* Leaderboard Content */}
            <div className="minecraft-card slide-up" style={{ padding: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  {currentTab.icon}
                  <h2 style={{ 
                    fontSize: '32px', 
                    fontWeight: '700', 
                    color: 'white',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {currentTab.title}
                  </h2>
                </div>
                <p style={{ 
                  fontSize: '16px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Inter, sans-serif',
                  marginBottom: activeTab === 'active' ? '8px' : '12px'
                }}>
                  {currentTab.description}
                </p>
                {activeTab === 'active' && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginBottom: '12px' 
                  }}>
                    <div className="info-tooltip-container" style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowInfo(!showInfo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <Info style={{ width: '12px', height: '12px' }} />
                        How are rankings calculated?
                      </button>
                      {showInfo && (
                        <div style={{
                          position: 'absolute',
                          top: '30px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px 20px',
                          width: '450px',
                          maxWidth: '90vw',
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: '1.5',
                          zIndex: 1000,
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
                        }}>
                          <strong>How rankings work:</strong> Players are ranked by an activity score that considers recent playtime, session frequency, consistency, and engagement - not just total hours played.
                          <div style={{
                            position: 'absolute',
                            top: '-6px',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: '12px',
                            height: '12px',
                            background: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderBottom: 'none',
                            borderRight: 'none'
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {data && (
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Updated {formatDateTime(data.lastUpdated)}
                  </p>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const activeData = getActiveData();
                  
                  return activeData.length > 0 ? (
                    activeData.map((player, index) => (
                      <PlayerCard key={player.uuid} player={player} rank={index + 1} />
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '64px 32px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                        {activeTab === 'active' ? '⏱️' : 
                         activeTab === 'killers' ? '⚔️' : '💀'}
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>
                        {activeTab === 'active' ? 'Players are joining!' : 
                         activeTab === 'killers' ? 'No combat data yet' : 'No death data yet'}
                      </h3>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        {activeTab === 'active' ? 
                          `${data?.mostActive?.length || 0} players have joined the server.` :
                         activeTab === 'killers' ? 
                          "Players haven't started battling mobs or each other yet." :
                          "Players haven't died yet... they're playing it safe!"}
                      </p>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Data syncs automatically every 30 minutes as players are active.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="leaderboard-sidebar" style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="minecraft-card slide-left" style={{ padding: '24px' }}>
                <h4 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '20px',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Server Stats
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const topPlayers = getTopPlayers();
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                            Most Active:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {topPlayers.mostActive && (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={'https://mc-heads.net/avatar/' + topPlayers.mostActive.name + '/32'}
                                  alt={topPlayers.mostActive.name + "'s head"}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                  display: 'none',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'white',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0
                                }}>
                                  {topPlayers.mostActive.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: '700', 
                              color: 'var(--success)',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {topPlayers.mostActive ? topPlayers.mostActive.name : 'Loading...'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                            Top Killer:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {topPlayers.topKiller && (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={'https://mc-heads.net/avatar/' + topPlayers.topKiller.name + '/32'}
                                  alt={topPlayers.topKiller.name + "'s head"}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                  display: 'none',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'white',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0
                                }}>
                                  {topPlayers.topKiller.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: '700', 
                              color: 'var(--error)',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {topPlayers.topKiller ? topPlayers.topKiller.name : 'No data yet'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                            Most Deaths:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {topPlayers.mostDeaths && (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={'https://mc-heads.net/avatar/' + topPlayers.mostDeaths.name + '/32'}
                                  alt={topPlayers.mostDeaths.name + "'s head"}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                  display: 'none',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: 'white',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0
                                }}>
                                  {topPlayers.mostDeaths.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: '700', 
                              color: 'var(--warning)',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {topPlayers.mostDeaths ? topPlayers.mostDeaths.name : 'No data yet'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                            Last Updated:
                          </span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            {data ? new Date(data.lastUpdated).toLocaleTimeString() : '--:--'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Footer */}
        <footer style={{ 
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(20, 20, 20, 0.9))',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.1)',
          padding: '48px 0',
          width: '100%'
        }}>
          <div style={{ 
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex', 
            gap: '40px', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap' 
          }}>
            {/* Footer Content */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px'
              }}>
                <p>&copy; 2024 The Refuge Minecraft Server. A legacy that&apos;s here to stay. ❤️</p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                  <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'none' }}>
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
            
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive layout for player cards */
        .mobile-layout {
          display: block;
        }
        .desktop-layout {
          display: none;
        }
        
        @media (min-width: 768px) {
          .mobile-layout {
            display: none;
          }
          .desktop-layout {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}