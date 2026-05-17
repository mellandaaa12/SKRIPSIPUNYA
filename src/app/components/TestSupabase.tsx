import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

interface TestSupabaseProps {
  theme: "dark" | "light";
}

export default function TestSupabase({ theme }: TestSupabaseProps) {
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      console.log("🔍 Testing Backend connection...");
      console.log("📍 Backend URL:", "/functions/v1/backend/kelas");

      // Test backend connection using direct Supabase client
      const [kelasRes, profilesRes] = await Promise.all([
        supabase.from('kelas').select('*').limit(5),
        supabase.from('profiles').select('*').limit(5)
      ]);

      if (kelasRes.error) {
        console.error("❌ Backend error:", kelasRes.error);
        setError(kelasRes.error.message || "Backend connection failed");
        setConnectionStatus("❌ Backend Failed");
      } else {
        console.log("✅ Backend data:", kelasRes.data);
        setData(kelasRes.data || []);
        
        if (!profilesRes.error) {
          console.log("✅ Profiles data:", profilesRes.data);
          setProfiles(profilesRes.data || []);
        }
        
        setConnectionStatus("✅ Connected to Backend");
      }
    } catch (err: any) {
      console.error("❌ Connection error:", err);
      setError(err.message);
      setConnectionStatus("❌ Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div style={{
      padding: "40px 32px",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(86,182,198,0.05)",
      margin: "40px 32px",
      borderRadius: "16px",
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(86,182,198,0.1)",
    }}>
      <h2 style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: "1.5rem",
        fontWeight: 700,
        color: isDark ? "white" : "#0a1f6e",
        marginBottom: "20px",
      }}>
        🔍 Backend Connection Test
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
      }}>
        <div style={{
          padding: "16px",
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
          borderRadius: "12px",
          border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(86,182,198,0.2)",
        }}>
          <div style={{
            fontSize: "0.9rem",
            color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
            marginBottom: "8px",
          }}>
            Status
          </div>
          <div style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: connectionStatus.includes("✅") ? "#00e676" : "#ef4444",
          }}>
            {connectionStatus}
          </div>
        </div>

        <div style={{
          padding: "16px",
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
          borderRadius: "12px",
          border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(86,182,198,0.2)",
        }}>
          <div style={{
            fontSize: "0.9rem",
            color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
            marginBottom: "8px",
          }}>
            URL
          </div>
          <div style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: isDark ? "white" : "#0a1f6e",
            wordBreak: "break-all",
          }}>
            Backend API
          </div>
        </div>

        <div style={{
          padding: "16px",
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
          borderRadius: "12px",
          border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(86,182,198,0.2)",
        }}>
          <div style={{
            fontSize: "0.9rem",
            color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
            marginBottom: "8px",
          }}>
            Data Count
          </div>
          <div style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: isDark ? "white" : "#0a1f6e",
          }}>
            {data.length} Classes, {profiles.length} Profiles
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "16px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "12px",
          marginBottom: "20px",
        }}>
          <div style={{
            color: "#ef4444",
            fontFamily: "monospace",
            fontSize: "0.9rem",
          }}>
            ❌ Error: {error}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
        }}>
          Loading...
        </div>
      ) : (
        <div>
          <h3 style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "1.2rem",
            fontWeight: 600,
            color: isDark ? "white" : "#0a1f6e",
            marginBottom: "16px",
          }}>
            📊 Classes Data from Backend:
          </h3>
          {data.length > 0 ? (
            <div style={{
              display: "grid",
              gap: "12px",
            }}>
              {data.map((item, index) => (
                <div key={index} style={{
                  padding: "16px",
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
                  borderRadius: "8px",
                  border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(86,182,198,0.15)",
                }}>
                  <div style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    color: isDark ? "white" : "#0a1f6e",
                    marginBottom: "8px",
                  }}>
                    {item.name} ({item.grade})
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
                  }}>
                    {item.subtitle} • {item.subject}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(10,31,110,0.5)",
            }}>
              No data found
            </div>
          )}
        </div>
      )}

      <h3 style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: "1.2rem",
        fontWeight: 600,
        color: isDark ? "white" : "#0a1f6e",
        marginBottom: "16px",
        marginTop: "30px",
      }}>
        👥 Profiles Data from Backend:
      </h3>
      {profiles.length > 0 ? (
        <div style={{
          display: "grid",
          gap: "12px",
        }}>
          {profiles.map((item, index) => (
            <div key={index} style={{
              padding: "16px",
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(86,182,198,0.15)",
            }}>
              <div style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 600,
                color: isDark ? "white" : "#0a1f6e",
                marginBottom: "8px",
              }}>
                {item.name} ({item.role})
              </div>
              <div style={{
                fontSize: "0.9rem",
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(10,31,110,0.7)",
              }}>
                {item.email} • Status: {item.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: isDark ? "rgba(255,255,255,0.5)" : "rgba(10,31,110,0.5)",
        }}>
          No profiles found
        </div>
      )}

      <button
        onClick={testSupabaseConnection}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "linear-gradient(135deg, #ffd600, #ff6d00)",
          color: "#002171",
          border: "none",
          borderRadius: "8px",
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        🔄 Refresh Connection
      </button>
    </div>
  );
}
