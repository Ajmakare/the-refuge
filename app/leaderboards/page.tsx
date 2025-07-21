"use client";

import { Trophy, Clock, Sword, Home, BarChart3, Crown, Star, Target } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LeaderboardData, PlayerStats } from "@/lib/types";
import { formatPlaytime, formatNumber, formatDate } from "@/lib/utils";

export default function Leaderboards() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'killers' | 'sessions' | 'deaths'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real leaderboards data
    console.log('Fetching leaderboards data...');
    fetch('/data/leaderboards.json')
      .then(res => {
        console.log('Fetch response:', res.status, res.statusText);
        return res.json();
      })
      .then((data: LeaderboardData) => {
        console.log('Leaderboards data loaded:', data);
        console.log('Most active players:', data.mostActive?.length || 0);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load leaderboard data:', err);
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

  const getActiveData = (): PlayerStats[] => {
    if (!data) {
      console.log('getActiveData: No data available');
      return [];
    }
    
    // Create a map of players from mostActive for merging with other data
    const activePlayersMap = new Map<string, PlayerStats>();
    data.mostActive.forEach(player => {
      activePlayersMap.set(player.uuid, player);
    });
    
    let result: PlayerStats[];
    switch (activeTab) {
      case 'active': 
        // For active players, show all players but sort by playtime (then by join date)
        result = [...data.mostActive].sort((a, b) => {
          if (b.playtime !== a.playtime) return b.playtime - a.playtime;
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        });
        break;
      case 'killers': 
        // Merge killer data with active player data to get complete stats
        result = data.topKillers
          .filter(killer => (killer.kills.mob + killer.kills.player) > 0)
          .map(killer => {
            const activePlayer = activePlayersMap.get(killer.uuid);
            if (activePlayer) {
              // Merge the data, prioritizing the killer's kill stats
              return {
                ...activePlayer,
                kills: killer.kills, // Use kill data from topKillers
                lastSeen: activePlayer.lastSeen || killer.lastSeen,
                playtime: activePlayer.playtime || 0,
                sessions: activePlayer.sessions || 0,
                deaths: activePlayer.deaths || killer.deaths,
                afkTime: activePlayer.afkTime || killer.afkTime,
                daysActive: activePlayer.daysActive || killer.daysActive
              };
            }
            return killer;
          })
          .sort((a, b) => (b.kills.mob + b.kills.player) - (a.kills.mob + a.kills.player));
        break;
      case 'sessions': 
        // For sessions, use longest sessions if available, otherwise filter active players
        result = data.longestSessions.length > 0 ? data.longestSessions :
          data.mostActive.filter(p => p.sessions > 0).sort((a, b) => b.sessions - a.sessions);
        break;
      case 'deaths':
        // Merge deaths data with active player data to get complete stats
        result = data.mostDeaths.length > 0 ? 
          data.mostDeaths
            .filter(deathPlayer => deathPlayer.deaths > 0)
            .map(deathPlayer => {
              const activePlayer = activePlayersMap.get(deathPlayer.uuid);
              if (activePlayer) {
                // Merge the data, prioritizing the death player's death stats
                return {
                  ...activePlayer,
                  deaths: deathPlayer.deaths, // Use death data from mostDeaths
                  lastSeen: activePlayer.lastSeen || deathPlayer.lastSeen,
                  playtime: activePlayer.playtime || 0,
                  sessions: activePlayer.sessions || deathPlayer.sessions,
                  kills: activePlayer.kills || deathPlayer.kills,
                  afkTime: activePlayer.afkTime || deathPlayer.afkTime,
                  daysActive: activePlayer.daysActive || deathPlayer.daysActive
                };
              }
              return deathPlayer;
            })
            .sort((a, b) => b.deaths - a.deaths) :
          data.mostActive.filter(p => p.deaths > 0).sort((a, b) => b.deaths - a.deaths);
        break;
      default: 
        result = [];
    }
    console.log(`getActiveData for tab "${activeTab}":`, result?.length || 0, 'players');
    return result || [];
  };

  const getTabConfig = (tab: string) => {
    switch (tab) {
      case 'active': 
        return { 
          icon: <Clock style={{ width: "20px", height: "20px" }} />, 
          title: 'Most Active Players',
          description: 'Players ranked by activity score (active time + engagement + frequency)'
        };
      case 'killers': 
        return { 
          icon: <Sword style={{ width: "20px", height: "20px" }} />, 
          title: 'Top Combat Players',
          description: 'Players with the most mob and PvP kills'
        };
      case 'sessions': 
        return { 
          icon: <Target style={{ width: "20px", height: "20px" }} />, 
          title: 'Longest Sessions',
          description: 'Players with the most dedicated gaming sessions'
        };
      case 'deaths':
        return {
          icon: <Trophy style={{ width: "20px", height: "20px", color: "#ef4444" }} />,
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
      if (rank === 3) return <Trophy style={{ width: "24px", height: "24px", color: "#CD7F32" }} />;
      return <span style={{ color: "var(--primary)", fontSize: "18px", fontWeight: "600" }}>#{rank}</span>;
    };

    const getRankColor = (rank: number) => {
      if (rank === 1) return "linear-gradient(135deg, #FFD700, #FFA500)";
      if (rank === 2) return "linear-gradient(135deg, #C0C0C0, #A0A0A0)";
      if (rank === 3) return "linear-gradient(135deg, #CD7F32, #B8860B)";
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
        case 'sessions': 
          return { 
            value: player.sessions > 0 ? player.sessions.toString() : 'Starting', 
            label: player.sessions > 0 ? 'Sessions' : 'Building History' 
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
        border: rank <= 3 ? `2px solid ${rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'}` : '1px solid var(--glass-border)',
        opacity: 1,
        transform: 'translateY(0)'
      }}>
        <div className="player-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '280px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: getRankColor(rank),
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}>
              {getRankIcon(rank)}
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
            }}>
              <img 
                src={`https://mc-heads.net/avatar/${player.name}/56`}
                alt={`${player.name}'s Minecraft head`}
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
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: 'white',
                marginBottom: '4px',
                fontFamily: 'Inter, sans-serif'
              }}>
                {player.name}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Joined {formatDate(player.joinDate)}
              </p>
            </div>
          </div>
          
          {/* Primary Stat */}
          <div style={{ 
            textAlign: 'center',
            padding: '16px 24px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: 'var(--primary)',
              fontFamily: 'Inter, sans-serif'
            }}>
              {displayStat.value}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
              {displayStat.label}
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="player-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '16px', flex: '1', minWidth: '320px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: player.kills.mob > 0 ? 'var(--success)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatNumber(player.kills.mob)}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                Mob Kills
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: player.kills.player > 0 ? 'var(--error)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatNumber(player.kills.player)}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                PvP Kills
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: (player.daysActive || 0) > 0 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {player.daysActive || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                Days Active
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: player.sessions > 0 ? 'var(--warning)' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {player.sessions}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter, sans-serif' }}>
                Sessions
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Inter, sans-serif'
              }}>
                {formatDate(player.lastSeen)}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif' }}>
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
        minHeight: "100vh", 
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
          url('/images/minecraft_bg.avif')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
      minHeight: "100vh", 
      backgroundImage: `
        linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
        url('/images/minecraft_bg.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Background blur overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/images/minecraft_bg.avif')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        filter: 'blur(8px)',
        zIndex: -1
      }} />

      {/* Fixed Sidebar Ad */}
      <div className="fixed-sidebar-ad" style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 50
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '12px',
          width: '300px',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          [Premium AdSense Sidebar - 300x600]
        </div>
      </div>

      {/* Clean Navigation */}
      <nav style={{
        position: 'fixed',
        top: '32px',
        right: '32px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" className="modern-button secondary">
            <Home style={{ width: "16px", height: "16px" }} />
            Home
          </Link>
          <Link href="/leaderboards" className="modern-button">
            <BarChart3 style={{ width: "16px", height: "16px" }} />
            Leaderboards
          </Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ padding: '120px 32px 0 32px', maxWidth: '1200px', margin: '0 auto', flex: '1' }}>
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
            {data && (
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Inter, sans-serif'
              }}>
                Last updated: {formatDate(data.lastUpdated)}
              </p>
            )}
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
                { key: 'sessions' as const, label: 'Sessions' },
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
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {currentTab.description}
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const activeData = getActiveData();
                  console.log('Rendering leaderboard with data:', activeData);
                  console.log('Data length:', activeData.length);
                  console.log('First player:', activeData[0]);
                  
                  return activeData.length > 0 ? (
                    activeData.map((player, index) => {
                      console.log(`Rendering player ${index + 1}:`, player.name);
                      return <PlayerCard key={player.uuid} player={player} rank={index + 1} />;
                    })
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '64px 32px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                        {activeTab === 'active' ? '⏱️' : 
                         activeTab === 'killers' ? '⚔️' : 
                         activeTab === 'sessions' ? '🎮' : '🏗️'}
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>
                        {activeTab === 'active' ? 'Players are joining!' : 
                         activeTab === 'killers' ? 'No combat data yet' : 
                         activeTab === 'sessions' ? 'Building session history' : 'No building data yet'}
                      </h3>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        {activeTab === 'active' ? 
                          `${data?.mostActive?.length || 0} players have joined the server.` :
                         activeTab === 'killers' ? 
                          'Players haven\'t started battling mobs or each other yet.' :
                         activeTab === 'sessions' ?
                          'Players are building up their play session history.' :
                          'Players haven\'t started building yet.'}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                      Total Players:
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: 'var(--primary)',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {data ? data.mostActive.length : 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                      Most Active:
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: 'var(--success)',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {data && data.mostActive[0] ? data.mostActive[0].name : 'Loading...'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter, sans-serif' }}>
                      Top Killer:
                    </span>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: 'var(--error)',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {data && data.topKillers[0] ? data.topKillers[0].name : 'No data yet'}
                    </span>
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
              </div>
            </div>
            
            {/* Footer Ad */}
            <div className="footer-ad" style={{ flex: '0 0 320px' }}>
              <div style={{ 
                padding: "20px", 
                color: "rgba(255, 255, 255, 0.4)", 
                border: "2px dashed rgba(255, 255, 255, 0.1)",
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
                fontSize: '12px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                [Premium AdSense Footer - 320x100]
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
      `}</style>
    </div>
  );
}