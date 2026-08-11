import React, { useEffect, useState } from "react";
import {
  HeartHandshake,
  Quote,
  Plus,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchApprovedSuccessStories,
  fetchMySuccessStories,
  submitSuccessStory,
} from "../data/queries";

const defaultStories = [
  {
    id: "default-1",
    title: "From introduction to engagement",
    text: "Two families connected through compatible preferences and took the next step together.",
    tag: "Family alliance",
  },
  {
    id: "default-2",
    title: "A simple search, a meaningful connection",
    text: "Shared values, respectful communication and family involvement made the difference.",
    tag: "Community match",
  },
  {
    id: "default-3",
    title: "Porutham helped start the conversation",
    text: "The families reviewed the horoscope details and continued with a personal introduction.",
    tag: "Porutham",
  },
];

export default function SuccessStories() {
  const { colors } = useTheme();
  const { userId, session } = useAuth();

  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    groomName: "",
    brideName: "",
    weddingDate: "",
    city: "",
    story: "",
    photoUrl: "",
  });

  useEffect(() => {
    loadStories();
  }, [userId]);

  async function loadStories() {
    setLoading(true);

    const { data } = await fetchApprovedSuccessStories();
    setStories(data || []);

    if (userId) {
      const { data: mine } = await fetchMySuccessStories(userId);
      setMyStories(mine || []);
    } else {
      setMyStories([]);
    }

    setLoading(false);
  }

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!session || !userId) {
      alert("Please log in first.");
      return;
    }

    if (!form.groomName.trim()) {
      alert("Please enter groom name.");
      return;
    }

    if (!form.brideName.trim()) {
      alert("Please enter bride name.");
      return;
    }

    if (!form.story.trim()) {
      alert("Please write your success story.");
      return;
    }

    setSaving(true);

    const { error } = await submitSuccessStory({
      userId,
      groomName: form.groomName.trim(),
      brideName: form.brideName.trim(),
      weddingDate: form.weddingDate || null,
      city: form.city.trim(),
      story: form.story.trim(),
      photoUrl: form.photoUrl.trim(),
    });

    setSaving(false);

    if (error) {
      console.error("Success story submit error:", error);
      alert("Could not submit your success story.");
      return;
    }

    setForm({
      groomName: "",
      brideName: "",
      weddingDate: "",
      city: "",
      story: "",
      photoUrl: "",
    });

    setShowForm(false);
    await loadStories();

    alert(
      "Success story submitted successfully. Admin approval is required before publishing."
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 5,
        }}
      >
        <HeartHandshake size={21} color={colors.primary} />

        <h2
          className="serif"
          style={{
            fontSize: 20,
            margin: 0,
          }}
        >
          Success Stories / வெற்றிக் கதைகள்
        </h2>
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: colors.textMuted,
          lineHeight: 1.6,
          marginTop: 6,
        }}
      >
        Celebrate meaningful family connections made through
        Naicker Matrimony.
        <br />
        Naicker Matrimony மூலம் உருவான மகிழ்ச்சியான குடும்ப
        இணைப்புகளைப் பகிருங்கள்.
      </p>

      {/* SUBMIT BUTTON */}
      {session && (
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 11,
            padding: "11px 13px",
            background: colors.primary,
            color: colors.primaryText,
            fontWeight: 800,
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          <Plus size={16} />
          {showForm
            ? "Close Form / படிவத்தை மூடவும்"
            : "Share Your Success Story / உங்கள் வெற்றிக் கதையை பகிரவும்"}
        </button>
      )}

      {/* FORM */}
      {showForm && session && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 15,
            padding: 15,
            marginBottom: 16,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 11,
            }}
          >
            Submit Success Story / வெற்றிக் கதையை சமர்ப்பிக்கவும்
          </div>

          <Field
            label="Groom Name / மணமகன் பெயர்"
            value={form.groomName}
            onChange={(v) => updateField("groomName", v)}
            colors={colors}
            required
          />

          <Field
            label="Bride Name / மணமகள் பெயர்"
            value={form.brideName}
            onChange={(v) => updateField("brideName", v)}
            colors={colors}
            required
          />

          <Field
            label="Wedding Date / திருமண தேதி"
            type="date"
            value={form.weddingDate}
            onChange={(v) => updateField("weddingDate", v)}
            colors={colors}
          />

          <Field
            label="City / நகரம்"
            value={form.city}
            onChange={(v) => updateField("city", v)}
            colors={colors}
          />

          <Field
            label="Photo URL / புகைப்பட URL"
            value={form.photoUrl}
            onChange={(v) => updateField("photoUrl", v)}
            colors={colors}
          />

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            Story / வெற்றிக் கதை *
          </label>

          <textarea
            value={form.story}
            onChange={(e) =>
              updateField("story", e.target.value)
            }
            placeholder="Tell us about your journey..."
            rows={5}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: 10,
              borderRadius: 9,
              border: `1px solid ${colors.cardBorder}`,
              background: colors.inputBg || colors.card,
              color: colors.text,
              fontSize: 12,
              outline: "none",
              marginBottom: 10,
            }}
          />

          <div
            style={{
              background: colors.pendingBg,
              color: colors.pendingText,
              borderRadius: 9,
              padding: 9,
              fontSize: 10.5,
              lineHeight: 1.5,
              marginBottom: 11,
            }}
          >
            Your story will be reviewed by admin before it is
            published.
            <br />
            உங்கள் கதை Admin approval-க்கு பிறகு மட்டுமே
            வெளியிடப்படும்.
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 9,
              padding: 11,
              background: saving
                ? colors.textFaint
                : colors.primary,
              color: colors.primaryText,
              fontWeight: 800,
              fontSize: 12,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving
              ? "Submitting..."
              : "Submit Story / கதையை சமர்ப்பிக்கவும்"}
          </button>
        </form>
      )}

      {/* PENDING STORIES */}
      {myStories.length > 0 && (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 15,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            My Submissions / எனது சமர்ப்பிப்புகள்
          </div>

          {myStories.map((story) => (
            <div
              key={story.id}
              style={{
                padding: "9px 0",
                borderTop: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {story.status === "approved" ? (
                  <CheckCircle2
                    size={14}
                    color={colors.approvedText}
                  />
                ) : (
                  <Clock3
                    size={14}
                    color={colors.pendingText}
                  />
                )}

                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {story.groom_name} & {story.bride_name}
                </span>

                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "3px 6px",
                    borderRadius: 999,
                    background:
                      story.status === "approved"
                        ? colors.approvedBg
                        : colors.pendingBg,
                    color:
                      story.status === "approved"
                        ? colors.approvedText
                        : colors.pendingText,
                  }}
                >
                  {story.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLIC STORIES */}
      <div
        className="serif"
        style={{
          fontSize: 16,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        Our Stories / எங்கள் வெற்றிக் கதைகள்
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 25,
            color: colors.textFaint,
            fontSize: 12,
          }}
        >
          Loading stories...
        </div>
      ) : (
        <>
          {/* Existing sample stories */}
          {defaultStories.map((s) => (
            <StoryCard
              key={s.id}
              title={s.title}
              text={s.text}
              tag={s.tag}
              colors={colors}
            />
          ))}

          {/* Approved database stories */}
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              title={`${s.groom_name} & ${s.bride_name}`}
              text={s.story}
              tag={s.city || "Success Story"}
              date={s.wedding_date}
              photoUrl={s.photo_url}
              colors={colors}
            />
          ))}

          {stories.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: colors.textFaint,
                fontSize: 11.5,
                padding: "8px 0 15px",
              }}
            >
              More verified stories will appear here after
              admin approval.
              <br />
              Admin approval-க்கு பிறகு புதிய கதைகள் இங்கே
              தோன்றும்.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StoryCard({
  title,
  text,
  tag,
  date,
  photoUrl,
  colors,
}) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 15,
        padding: 16,
        marginBottom: 11,
      }}
    >
      {photoUrl && (
        <img
          src={photoUrl}
          alt=""
          style={{
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            borderRadius: 11,
            marginBottom: 11,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: 9,
          alignItems: "center",
          marginBottom: 9,
        }}
      >
        <HeartHandshake
          size={19}
          color={colors.primary}
        />

        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.6,
          color: colors.textMuted,
        }}
      >
        <Quote
          size={13}
          style={{
            verticalAlign: "middle",
            marginRight: 4,
          }}
        />

        {text}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {tag && (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 999,
              background: colors.pendingBg,
              color: colors.pendingText,
              fontSize: 10.5,
              fontWeight: 800,
            }}
          >
            {tag}
          </span>
        )}

        {date && (
          <span
            style={{
              fontSize: 10,
              color: colors.textFaint,
            }}
          >
            Wedding: {date}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  type = "text",
  required = false,
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 11.5,
          fontWeight: 700,
          marginBottom: 5,
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "9px 10px",
          borderRadius: 9,
          border: `1px solid ${colors.cardBorder}`,
          background: colors.inputBg || colors.card,
          color: colors.text,
          fontSize: 12,
          outline: "none",
        }}
      />
    </div>
  );
}
