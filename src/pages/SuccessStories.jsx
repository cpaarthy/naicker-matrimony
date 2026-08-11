import React, { useEffect, useState } from "react";
import {
  HeartHandshake,
  Quote,
  Plus,
  Clock3,
  CheckCircle2,
  XCircle,
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
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");

    try {
      const approvedResult = await fetchApprovedSuccessStories();

      if (approvedResult?.error) {
        console.error(
          "Approved stories load error:",
          approvedResult.error
        );
      }

      setStories(approvedResult?.data || []);

      if (userId) {
        const mineResult = await fetchMySuccessStories(userId);

        if (mineResult?.error) {
          console.error(
            "My stories load error:",
            mineResult.error
          );
        }

        setMyStories(mineResult?.data || []);
      } else {
        setMyStories([]);
      }
    } catch (err) {
      console.error("Success stories load error:", err);
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

    setErrorMessage("");

    if (!session || !userId) {
      setErrorMessage(
        "Please log in first / முதலில் Login செய்யவும்."
      );
      return;
    }

    if (!form.groomName.trim()) {
      setErrorMessage(
        "Please enter groom name / மணமகன் பெயரை உள்ளிடவும்."
      );
      return;
    }

    if (!form.brideName.trim()) {
      setErrorMessage(
        "Please enter bride name / மணமகள் பெயரை உள்ளிடவும்."
      );
      return;
    }

    if (!form.story.trim()) {
      setErrorMessage(
        "Please write your story / உங்கள் கதையை எழுதவும்."
      );
      return;
    }

    setSaving(true);

    try {
      const result = await submitSuccessStory({
        userId,
        groomName: form.groomName.trim(),
        brideName: form.brideName.trim(),
        weddingDate: form.weddingDate || null,
        city: form.city.trim() || null,
        story: form.story.trim(),
        photoUrl: form.photoUrl.trim() || null,
      });

      console.log("SUCCESS STORY SUBMIT RESULT:", result);

      if (result?.error) {
        console.error(
          "SUCCESS STORY SUBMIT ERROR:",
          result.error
        );

        const message =
          result.error?.message ||
          result.error?.details ||
          result.error?.hint ||
          "Unknown database error";

        const code = result.error?.code
          ? ` (${result.error.code})`
          : "";

        setErrorMessage(
          `Could not submit your success story${code}: ${message}`
        );

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
    } catch (err) {
      console.error(
        "UNEXPECTED SUCCESS STORY ERROR:",
        err
      );

      setErrorMessage(
        err?.message ||
          "Unexpected error while submitting the story."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ paddingBottom: 25 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 5,
        }}
      >
        <HeartHandshake
          size={21}
          color={colors.primary}
        />

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
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setErrorMessage("");
          }}
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

      {/* ERROR */}
      {errorMessage && (
        <div
          style={{
            background: colors.rejectedBg,
            color: colors.rejectedText,
            border: `1px solid ${colors.rejectedText}`,
            borderRadius: 11,
            padding: 11,
            marginBottom: 13,
            fontSize: 11.5,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          <XCircle
            size={14}
            style={{
              verticalAlign: "middle",
              marginRight: 5,
            }}
          />

          {errorMessage}
        </div>
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
            onChange={(value) =>
              updateField("groomName", value)
            }
            colors={colors}
            required
          />

          <Field
            label="Bride Name / மணமகள் பெயர்"
            value={form.brideName}
            onChange={(value) =>
              updateField("brideName", value)
            }
            colors={colors}
            required
          />

          <Field
            label="Wedding Date / திருமண தேதி"
            type="date"
            value={form.weddingDate}
            onChange={(value) =>
              updateField("weddingDate", value)
            }
            colors={colors}
          />

          <Field
            label="City / நகரம்"
            value={form.city}
            onChange={(value) =>
              updateField("city", value)
            }
            colors={colors}
          />

          <Field
            label="Photo URL / புகைப்பட URL"
            value={form.photoUrl}
            onChange={(value) =>
              updateField("photoUrl", value)
            }
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
              background:
                colors.inputBg || colors.card,
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
            Your story will be reviewed by admin before
            publishing.
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

      {/* MY SUBMISSIONS */}
      {session && myStories.length > 0 && (
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

          {myStories.map((story) => {
            const isApproved =
              story.status === "approved";

            const isRejected =
              story.status === "rejected";

            return (
              <div
                key={story.id}
                style={{
                  padding: "10px 0",
                  borderTop: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {isApproved ? (
                    <CheckCircle2
                      size={14}
                      color={colors.approvedText}
                    />
                  ) : isRejected ? (
                    <XCircle
                      size={14}
                      color={colors.rejectedText}
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
                    {story.groom_name} &{" "}
                    {story.bride_name}
                  </span>

                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "3px 6px",
                      borderRadius: 999,
                      background: isApproved
                        ? colors.approvedBg
                        : isRejected
                        ? colors.rejectedBg
                        : colors.pendingBg,
                      color: isApproved
                        ? colors.approvedText
                        : isRejected
                        ? colors.rejectedText
                        : colors.pendingText,
                    }}
                  >
                    {(story.status || "pending").toUpperCase()}
                  </span>
                </div>

                {story.city && (
                  <div
                    style={{
                      marginTop: 4,
                      marginLeft: 21,
                      fontSize: 10,
                      color: colors.textFaint,
                    }}
                  >
                    {story.city}
                  </div>
                )}
              </div>
            );
          })}
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
          {/* EXISTING STORIES */}
          {defaultStories.map((story) => (
            <StoryCard
              key={story.id}
              title={story.title}
              text={story.text}
              tag={story.tag}
              colors={colors}
            />
          ))}

          {/* APPROVED DATABASE STORIES */}
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              title={`${story.groom_name} & ${story.bride_name}`}
              text={story.story}
              tag={story.city || "Success Story"}
              date={story.wedding_date}
              photoUrl={story.photo_url}
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
          background:
            colors.inputBg || colors.card,
          color: colors.text,
          fontSize: 12,
          outline: "none",
        }}
      />
    </div>
  );
}
