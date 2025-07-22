"use client";
import { Shield, Pickaxe, Vote, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
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

    // Observe all elements with fade-in class
    const elementsToAnimate = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right');
    elementsToAnimate.forEach((el) => observer.observe(el));

    return () => {
      elementsToAnimate.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundImage: `
        linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
        url('/images/minecraft_bg.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: 'blur(0px)',
      position: 'relative'
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
      


      <div className="container" style={{ padding: '0 32px', maxWidth: '900px' }}>
        {/* Expanded Hero Section */}
        <div style={{ padding: '60px 0', display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <Image 
              src="/images/fontbolt.png" 
              alt="The Refuge - Minecraft Server Logo" 
              width={1400}
              height={400}
              priority
              className="fade-in hero-logo"
              style={{ 
                maxWidth: '1400px',
                width: '100%',
                height: 'auto',
                marginBottom: '64px',
                filter: 'drop-shadow(0 16px 64px rgba(0, 0, 0, 0.7))',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }} 
            />
            
            <div className="slide-up" style={{ 
              maxWidth: '900px',
              margin: '0 auto 64px auto',
              textAlign: 'center'
            }}>
              <div className="hero-tagline" style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#7dd3fc',
                marginBottom: '16px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 2px 20px rgba(125, 211, 252, 0.3)'
              }}>
                6 Years Strong & Thriving
              </div>
              
              <div className="hero-description" style={{
                fontSize: '28px',
                fontWeight: '300',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.5',
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, sans-serif'
              }}>
                A <span style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 1)' }}>semi-vanilla PvE</span> survival server
                <br />
                with <span style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 1)' }}>deep lore</span> and <span style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 1)' }}>democratic community</span>
              </div>
            </div>
            
            <div className="fade-in stagger-children hero-buttons" style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "24px",
              flexWrap: "wrap"
            }}>
              <a 
                href="https://discord.gg/hVZKGgucWd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="modern-button primary"
                style={{ fontSize: '18px', padding: '20px 40px', '--stagger-delay': '1' } as React.CSSProperties}
              >
                💬 Join Discord & Apply
              </a>
              
              <Link 
                href="/leaderboards"
                className="modern-button secondary"
                style={{ fontSize: '18px', padding: '20px 40px', '--stagger-delay': '2' } as React.CSSProperties}
              >
                📊 View Leaderboards
              </Link>
            </div>
            
            {/* PlanetMinecraft Link */}
            <div className="fade-in" style={{ 
              display: "flex", 
              justifyContent: "center", 
              marginTop: "32px"
            }}>
              <a 
                href="https://www.planetminecraft.com/server/the-refuge-a-brand-new-vanilla-pve-server-whitelist-discord"
                target="_blank" 
                rel="noopener noreferrer"
                className="modern-button secondary"
                style={{ 
                  fontSize: '16px', 
                  padding: '12px 24px',
                  backgroundColor: 'rgba(46, 160, 67, 0.1)',
                  borderColor: 'rgba(46, 160, 67, 0.3)',
                  color: 'white'
                }}
              >
                🌍 View on PlanetMinecraft
              </a>
            </div>
          </div>
        </div>


        {/* What Makes Us Special */}
        <div className="slide-up" style={{ marginBottom: '80px' }}>
          <h2 className="fade-in" style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            textAlign: 'center',
            marginBottom: '64px',
            fontFamily: 'Inter, sans-serif',
            color: 'white'
          }}>
            Why Choose The Refuge?
          </h2>
          
          <div className="grid grid-2 stagger-children" style={{ gap: '32px' }}>
            <div className="minecraft-card text-white">
              <div className="flex items-center mb-4">
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  marginRight: '20px'
                }}>
                  <Vote style={{ width: "28px", height: "28px", color: "white" }} />
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                  Democratic Community
                </h3>
              </div>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                Your voice matters! We thrive on community ideas with regular polling and decision-making. 
                Shape our world and contribute to major server decisions.
              </p>
            </div>

            <div className="minecraft-card text-white">
              <div className="flex items-center mb-4">
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--success), #059669)',
                  marginRight: '20px'
                }}>
                  <Calendar style={{ width: "28px", height: "28px", color: "white" }} />
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                  Rich Lore & Events
                </h3>
              </div>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                Experience deep storytelling and participate in community events. 
                Our server has a rich history and evolving narrative that players help create.
              </p>
            </div>

            <div className="minecraft-card text-white">
              <div className="flex items-center mb-4">
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--accent), #0891b2)',
                  marginRight: '20px'
                }}>
                  <Shield style={{ width: "28px", height: "28px", color: "white" }} />
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                  Seasoned Staff
                </h3>
              </div>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                Our dedicated staff team has been guiding the server since inception. 
                Foundations sturdier than bedrock, built on years of experience.
              </p>
            </div>

            <div className="minecraft-card text-white">
              <div className="flex items-center mb-4">
                <div style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--secondary), #7c3aed)',
                  marginRight: '20px'
                }}>
                  <Pickaxe style={{ width: "28px", height: "28px", color: "white" }} />
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                  Essential Plugins
                </h3>
              </div>
              <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                LuckPerms, WorldGuard/Edit, CoreProtect, and Essentials ensure seamless gameplay 
                while maintaining the vanilla feel you love.
              </p>
            </div>
          </div>
        </div>

        {/* Server Rules */}
        <div className="minecraft-card text-white slide-up" style={{ marginBottom: '80px' }}>
          <h3 className="fade-in" style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            marginBottom: '48px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            color: 'white'
          }}>
            Server Rules
          </h3>
          <div className="grid grid-2 stagger-children" style={{ gap: '32px' }}>
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '1' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--success)' }}>
                1. Be Respectful
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                Everyone is welcomed here. Be respectful and courteous. Bullying, harassment, and offensive language are forbidden.
              </p>
            </div>
            
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '2' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>
                2. No Griefing or Stealing
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                Respect others&apos; property. No destroying, modifying, or taking other players&apos; builds, items, or pets without permission.
              </p>
            </div>
            
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '3' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--error)' }}>
                3. No Exploiting
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                No hacks, cheats, or exploit abuse. FPS and aesthetic mods (shaders, brightness) are acceptable.
              </p>
            </div>
            
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '4' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--accent)' }}>
                4. Keep it PG-13
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                Keep all content appropriate for all ages. If it can&apos;t be shown in a Marvel movie, it won&apos;t fly here.
              </p>
            </div>
            
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '5' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--neutral)' }}>
                5. No Advertising
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                Don&apos;t promote other servers, websites, or unapproved services within our community.
              </p>
            </div>
            
            <div className="fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', '--stagger-delay': '6' } as React.CSSProperties}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: 'var(--success)' }}>
                6. Consensual PvP
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                PvP is allowed only with mutual consent. All items must be returned after combat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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
          padding: '0 32px'
        }}>
          <div className="footer-content" style={{ display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
        </div>
      </footer>
      
    </div>
  );
}