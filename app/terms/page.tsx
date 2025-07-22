import Link from "next/link";
import { Home, FileText } from "lucide-react";

export default function Terms() {
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
            <FileText style={{ width: "32px", height: "32px", marginRight: "16px", color: "var(--primary)" }} />
            <h1 style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'Inter, sans-serif' }}>
              Terms of Service
            </h1>
          </div>
          
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div style={{ lineHeight: '1.8', fontSize: '16px' }}>
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Acceptance of Terms
              </h2>
              <p style={{ marginBottom: '16px' }}>
                By accessing and using The Refuge website, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Use License
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Permission is granted to temporarily view the materials on The Refuge website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>modify or copy the materials</li>
                <li style={{ marginBottom: '8px' }}>use the materials for any commercial purpose or for any public display</li>
                <li style={{ marginBottom: '8px' }}>attempt to reverse engineer any software contained on the website</li>
                <li style={{ marginBottom: '8px' }}>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Website Content
              </h2>
              <p style={{ marginBottom: '16px' }}>
                The content displayed on this website includes:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Public Game Statistics:</strong> Minecraft server data that is publicly available through the PLAN plugin
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Server Information:</strong> General information about The Refuge Minecraft server
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Community Features:</strong> Links to our Discord server and community resources
                </li>
              </ul>
              <p style={{ marginBottom: '16px' }}>
                All Minecraft-related trademarks and copyrights belong to Mojang Studios. This website is not affiliated with or endorsed by Mojang Studios.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Prohibited Uses
              </h2>
              <p style={{ marginBottom: '16px' }}>
                You may not use our website:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>For any unlawful purpose or to solicit others to unlawful acts</li>
                <li style={{ marginBottom: '8px' }}>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li style={{ marginBottom: '8px' }}>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
                <li style={{ marginBottom: '8px' }}>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
                <li style={{ marginBottom: '8px' }}>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
                <li style={{ marginBottom: '8px' }}>To engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the website</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Rate Limiting and Fair Use
              </h2>
              <p style={{ marginBottom: '16px' }}>
                To ensure fair access for all users, we implement rate limiting on our API endpoints. Excessive requests may result in temporary restrictions. Automated scraping or data harvesting is not permitted without explicit permission.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Disclaimer
              </h2>
              <p style={{ marginBottom: '16px' }}>
                The information on this website is provided on an &apos;as is&apos; basis. To the fullest extent permitted by law, this Company:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>excludes all representations and warranties relating to this website and its contents</li>
                <li style={{ marginBottom: '8px' }}>excludes all liability for damages arising out of or in connection with your use of this website</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Limitations
              </h2>
              <p style={{ marginBottom: '16px' }}>
                In no event shall The Refuge or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on The Refuge&apos;s website, even if The Refuge or a The Refuge authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Revisions and Errata
              </h2>
              <p style={{ marginBottom: '16px' }}>
                The materials appearing on The Refuge&apos;s website could include technical, typographical, or photographic errors. The Refuge does not warrant that any of the materials on its website are accurate, complete, or current. The Refuge may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Contact Information
              </h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through our{' '}
                <a href="https://discord.gg/hVZKGgucWd" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  Discord server
                </a>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary)' }}>
                Changes to Terms
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}