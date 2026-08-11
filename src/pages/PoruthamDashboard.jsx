import React, { useState } from "react";
import { Star, ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchProfileById } from "../data/queries";
import { calculatePorutham, isHoroscopeDataAvailable } from "../utils/porutham";
import { calculateMatchScore, getMatchBreakdown, getMatchCategory } from "../utils/matchScore";

const VERDICT_LABELS = {
  Uthamam: { en: "Excellent Match / சிறந்த பொருத்தம்", tone: "approved" },
  Nalladhu: { en: "Good Match / நல்ல பொருத்தம்", tone: "approved" },
  Madhyamam: { en: "Average Match / மத்திம பொருத்தம்", tone: "pending" },
  Adhamam: { en: "Low Compatibility / குறைந்த பொருத்தம்", tone: "rejected" },
};

export default function PoruthamDashboard({ profileId, onNavigate }) {
  const { colors } = useTheme();
  const { profile: myProfile } = useAuth();
  const [otherProfile, setOtherProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetchProfileById(profileId).then(({ data }) => {
      setOtherProfile(data);
      setLoading(false);
    });
  }, [profileId]);

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  if (!myProfile || !otherProfile) {
    return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Profile not found.</div>;
  }

  if (!isHoroscopeDataAvailable(myProfile) || !isHoroscopeDataAvailable(otherProfile)) {
    return (
      <div>
        <BackLink onNavigate={onNavigate} colors={colors} />
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Star size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text, marginBottom: 6 }}>
            Horoscope details missing / ஜாதக விவரங்கள் இல்லை
          </div>
          <div style={{ fontSize: 13 }}>
            Both profiles need Star and Rasi filled in (under Horoscope Details) to calculate Porutham.
            <br />பொருத்தம் கணக்கிட, இரு விவரங்களிலும் நட்சத்திரம் மற்றும் ராசி தேவை.
          </div>
        </div>
      </div>
    );
  }

  const result = calculatePorutham(myProfile, otherProfile);

  if (!result) {
    return (
      <div>
        <BackLink onNavigate={onNavigate} colors={colors} />
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint }}>
          Could not recognize the Star/Rasi values entered. Please check spelling under Horoscope Details.
        </div>
      </div>
    );
  }

  const verdictInfo = VERDICT_LABELS[result.verdict];
  const toneColor = verdictInfo.tone === "approved" ? colors.approvedText : verdictInfo.tone === "pending" ? colors.pendingText : colors.rejectedText;
  const toneBg = verdictInfo.tone === "approved" ? colors.approvedBg : verdictInfo.tone === "pending" ? colors.pendingBg : colors.rejectedBg;

  const myStar = myProfile.gender === "Male" ? result.boyStar : result.girlStar;
  const myRasi = myProfile.gender === "Male" ? result.boyRasi : result.girlRasi;
  const otherStar = otherProfile.gender === "Male" ? result.boyStar : result.girlStar;
  const otherRasi = otherProfile.gender === "Male" ? result.boyRasi : result.girlRasi;

  return (
    <div>
      <BackLink onNavigate={onNavigate} colors={colors} />

      <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Porutham / பொருத்தம்</h2>
      <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 16 }}>
        Digital horoscope matching based on birth Star and Rasi. This is a traditional
        reference calculation — please also consult a family astrologer for important decisions.
        <br />நட்சத்திரம் & ராசி அடிப்படையிலான ஜாதக பொருத்தம். முக்கிய முடிவுகளுக்கு முன் குடும்ப ஜோதிடரையும் அணுகவும்.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>{myProfile.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{myStar}</div>
          <div style={{ fontSize: 11, color: colors.textFaint }}>{myRasi}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: colors.textFaint, fontSize: 18 }}>×</div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>{otherProfile.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{otherStar}</div>
          <div style={{ fontSize: 11, color: colors.textFaint }}>{otherRasi}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", background: toneBg, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: toneColor, fontFamily: "'Playfair Display', Georgia, serif" }}>
          {result.matchedCount} / {result.totalCount}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: toneColor, marginTop: 4 }}>{verdictInfo.en}</div>
      </div>

      {result.hasSeriousDosham && (
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-start", background: colors.rejectedBg,
          border: `1px solid ${colors.rejectedText}`, borderRadius: 10, padding: 12, marginBottom: 16,
        }}>
          <AlertTriangle size={16} color={colors.rejectedText} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: colors.rejectedText }}>
            <b>Rajju Dosham present.</b> Rajju is traditionally considered the most important porutham.
            Please consult a family astrologer before proceeding.
            <br />ராஜு தோஷம் உள்ளது — முக்கிய பொருத்தம், ஜோதிடரை அணுகவும்.
          </div>
        </div>
      )}

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 4 }}>
        {result.poruthams.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
            borderBottom: i < result.poruthams.length - 1 ? `1px solid ${colors.cardBorder}` : "none",
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>
                {p.label} {p.critical && <span style={{ fontSize: 10, color: colors.rejectedText, fontWeight: 700 }}>★ critical</span>}
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint }}>{p.note}</div>
            </div>
            {p.matched ? (
              <CheckCircle2 size={20} color={colors.approvedText} />
            ) : (
              <XCircle size={20} color={colors.rejectedText} />
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", gap: 8, alignItems: "flex-start", background: colors.pendingBg,
        borderRadius: 10, padding: 12, marginTop: 14,
      }}>
        <AlertTriangle size={15} color={colors.pendingText} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: colors.pendingText }}>
          This is an automatic reference calculation, not a certified reading. Please check with an astrologer before making any decisions based on this result.
          <br />இது ஒரு தானியங்கு கணக்கீடு மட்டுமே — இதன் அடிப்படையில் முடிவெடுக்கும் முன் ஜோதிடரிடம் ஆலோசிக்கவும்.
        </div>
      </div>
    </div>
  );
}

function BackLink({ onNavigate, colors }) {
  return (
    <button onClick={() => onNavigate("profileDetails")} style={{
      display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
      color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
    }}>
      <ArrowLeft size={14} /> Back to profile / விவரத்திற்கு திரும்பு
    </button>
  );
}
