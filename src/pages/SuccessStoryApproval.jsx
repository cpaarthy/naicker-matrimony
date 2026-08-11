import React, { useEffect, useState } from "react";
import { Check, X, HeartHandshake, CalendarDays, MapPin } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabaseClient";

export default function SuccessStoryApproval({ adminPin, showToast }) {
  const { colors } = useTheme();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  async function loadStories() {
    setLoading(true);

    const { data, error } = await supabase
      .from("success_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Success stories load error:", error);
      showToast?.("Could not load success stories");
      setStories([]);
    } else {
      setStories(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStories();
  }, []);

  async function updateStatus(id, status) {
    setSaving(id);

    const { error } = await supabase
      .from("success_stories")
      .update({
        status,
        approved_at: status === "approved"
          ? new Date().toISOString()
          : null,
      })
      .eq("id", id);

    if (error) {
      console.error("Success story status update error:", error);
      showToast?.("Could not update success story");
      setSaving(null);
      return;
    }

    showToast?.(
      status === "approved"
        ? "Success story approved"
        : "Success story rejected"
    );

    await loadStories();
    setSaving(null);
  }

  const pendingStories = stories.filter(
    (story) => story.status === "pending"
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2
          className="serif"
          style={{
            fontSize: 20,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <HeartHandshake size={20} color={colors.primary} />
          Success Stories / வெற்றிக் கதைகள்
        </h2>

        <div
          style={{
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 5,
          }}
        >
          Review and approve member success stories before publishing.
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            color: colors.textFaint,
            padding: 40,
          }}
        >
          Loading…
        </div>
      ) : pendingStories.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: 25,
            textAlign: "center",
            color: colors.textFaint,
            fontSize: 13,
          }}
        >
          No pending success stories.
        </div>
      ) : (
        pendingStories.map((story) => (
          <div
            key={story.id}
            style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: 15,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div
                  className="serif"
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {story.groom_name} ❤️ {story.bride_name}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 7,
                    fontSize: 11,
                    color: colors.textFaint,
                  }}
                >
                  {story.wedding_date && (
                    <span>
                      <CalendarDays
                        size={12}
                        style={{
                          verticalAlign: "middle",
                          marginRight: 3,
                        }}
                      />
                      {story.wedding_date}
                    </span>
                  )}

                  {story.city && (
                    <span>
                      <MapPin
                        size={12}
                        style={{
                          verticalAlign: "middle",
                          marginRight: 3,
                        }}
                      />
                      {story.city}
                    </span>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: "4px 7px",
                  borderRadius: 999,
                  background: colors.pendingBg,
                  color: colors.pendingText,
                }}
              >
                PENDING
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                lineHeight: 1.65,
                color: colors.textMuted,
                whiteSpace: "pre-wrap",
              }}
            >
              {story.story}
            </div>

            {story.photo_url && (
              <img
                src={story.photo_url}
                alt="Success story"
                style={{
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginTop: 12,
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
              }}
            >
              <button
                disabled={saving === story.id}
                onClick={() => updateStatus(story.id, "approved")}
                style={{
                  flex: 1,
                  border: 0,
                  borderRadius: 9,
                  padding: 10,
                  background: colors.approvedBg,
                  color: colors.approvedText,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Check
                  size={14}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 4,
                  }}
                />
                Approve
              </button>

              <button
                disabled={saving === story.id}
                onClick={() => updateStatus(story.id, "rejected")}
                style={{
                  flex: 1,
                  border: 0,
                  borderRadius: 9,
                  padding: 10,
                  background: colors.rejectedBg,
                  color: colors.rejectedText,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <X
                  size={14}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 4,
                  }}
                />
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}