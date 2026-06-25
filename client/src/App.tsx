function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          borderRadius: "16px",
          background: "#1e293b",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          maxWidth: "700px",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            marginBottom: "10px",
          }}
        >
          🚀 CI/CD Pipeline Successful
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "#cbd5e1",
            marginBottom: "30px",
          }}
        >
          This React application was automatically deployed using GitHub
          Actions, Docker, Docker Hub, and AWS EC2.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {[
            "React",
            "GitHub Actions",
            "Docker",
            "Docker Hub",
            "AWS EC2",
            "CI/CD",
          ].map((tech) => (
            <span
              key={tech}
              style={{
                background: "#334155",
                padding: "10px 16px",
                borderRadius: "999px",
                fontSize: "14px",
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#0f766e",
            borderRadius: "10px",
          }}
        >
          <strong>Deployment Status:</strong> Successful ✅
        </div>

        <p
          style={{
            marginTop: "25px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Every push to the main branch automatically triggers the deployment
          pipeline.
        </p>
      </div>
    </div>
  );
}

export default App;
