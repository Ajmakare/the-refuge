import Link from "next/link";
import { Home, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      color: 'white',
      padding: '32px'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: '32px',
        right: '32px',
        zIndex: 100
      }}>
        <Link href="/" className="modern-button">
          <Home style={{ width: "16px", height: "16px" }} />
          Home
        </Link>
      </nav>

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '120px' }}>
        <div className="minecraft-card text-white">
          <div className="flex items-center mb-6">
            <Shield style={{ width: "32px", height: "32px", marginRight: "16px", color: "var(--primary)" }} />
            <h1 style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'Inter, sans-serif' }}>
              Privacy Policy
            </h1>
          </div>
          
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div style={{ lineHeight: '1.8', fontSize: '16px' }}>
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Information We Collect
              </h2>
              <p style={{ marginBottom: '16px' }}>
                The Refuge website collects minimal information to provide our services:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Minecraft Player Data:</strong> Public gameplay statistics from our Minecraft server including usernames, playtime, and game statistics. This data is already public through the PLAN plugin.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Website Usage:</strong> Basic analytics through Vercel for website improvement and performance monitoring.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Technical Data:</strong> IP addresses for rate limiting and security purposes (not stored permanently).
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                How We Use Information
              </h2>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Display leaderboards and server statistics</li>
                <li style={{ marginBottom: '8px' }}>Improve website performance and user experience</li>
                <li style={{ marginBottom: '8px' }}>Prevent abuse and ensure security</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Third-Party Services
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We use the following third-party services:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Vercel:</strong> For website hosting and analytics
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>mc-heads.net:</strong> For Minecraft player avatar images
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Data Storage and Security
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We implement appropriate security measures to protect your information:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>HTTPS encryption for all data transmission</li>
                <li style={{ marginBottom: '8px' }}>Rate limiting to prevent abuse</li>
                <li style={{ marginBottom: '8px' }}>Regular security updates and monitoring</li>
                <li style={{ marginBottom: '8px' }}>Minimal data collection practices</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Your Rights
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Since most data displayed is public Minecraft server statistics, individual removal requests may not be possible. However, you have the right to:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Request information about what data we have</li>
                <li style={{ marginBottom: '8px' }}>Contact us about data concerns</li>
                <li style={{ marginBottom: '8px' }}>Opt out of non-essential cookies</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact us through our{' '}
                <a href="https://discord.gg/hVZKGgucWd" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  Discord server
                </a>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the &quot;Last updated&quot; date at the top of this policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}