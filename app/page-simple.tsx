export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(to bottom, var(--minecraft-grass), var(--minecraft-dirt))",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ color: "white", fontSize: "48px", textAlign: "center", marginBottom: "20px" }}>
        THE REFUGE
      </h1>
      <p style={{ color: "white", fontSize: "20px", textAlign: "center" }}>
        A Brand New Vanilla PVE Server
      </p>
    </div>
  );
}