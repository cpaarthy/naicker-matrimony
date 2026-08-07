import { useEffect, useState, useMemo } from "react";
import { Heart, Mail, ShieldCheck, Bell, Settings, Clock, Share2, HelpCircle, TrendingUp, Users, Sparkles, UserPlus, Activity, MapPin, BarChart3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, Badge } from "../components/ui";
import { LineChart, BarChart, DonutChart } from "../components/AdminCharts";
import Login from "./Login";
import ShareProfileModal from "../components/ShareProfileModal";
import { fetchRequestsFor, fetchNotifications, fetchApprovedProfiles, fetchBlockedProfiles, fetchProfileViewsReceived } from "../data/queries";
import { calculateMatchScore } from "../utils/matchScore";

const RECENT_DAYS = 30;
const ACTIVE_DAYS = 7;
const MONTH_LABELS_TA = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச"];

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function computeMatchAnalytics(myProfile, candidates) {
  try {
    if (!myProfile || !candidates) {
      console.warn("computeMatchAnalytics: missing data", { myProfile, candidates });
      return { total: 0, high: 0, medium: 0, newMembers: 0, recentlyActive: 0, nearby: 0, districtChart: [], ageChart: [], scoreBuckets: [] };
    }

    const opposingGender = myProfile.gender === "Male" ? "Female" : myProfile.gender === "Female" ? "Male" : null;
    const pool = candidates.filter(p => p.id !== myProfile.id && (!opposingGender || p.gender === opposingGender));

    const hasPrefs = !!(myProfile.pref_age_min || myProfile.pref_age_max || myProfile.pref_education || myProfile.pref_occupation);
    const matchesPreference = (p) => {
      if (!hasPrefs) return true;
      if (myProfile.pref_age_min && p.age < myProfile.pref_age_min) return false;
      if (myProfile.pref_age_max && p.age > myProfile.pref_age_max) return false;
      if (myProfile.pref_education && typeof p.education === 'string' && !p.education.toLowerCase().includes(myProfile.pref_education.toLowerCase())) return false;
      if (myProfile.pref_occupation && typeof p.occupation === 'string' && !p.occupation.toLowerCase().includes(myProfile.pref_occupation.toLowerCase())) return false;
      return true;
    };

    const matching = pool.filter(matchesPreference);

    let high = 0, medium = 0;
    const scoreBuckets = [
      { label: "0-20%", value: 0 }, { label: "21-40%", value: 0 }, { label: "41-60%", value: 0 },
      { label: "61-80%", value: 0 }, { label: "81-100%", value: 0 },
    ];

    console.log("Computing scores for", matching.length, "matching profiles");
    console.log("Profile info:", {
      myGender: myProfile.gender,
      myAge: myProfile.age,
      myCity: myProfile.city,
      myDistrict: myProfile.district,
      prefAgeMin: myProfile.pref_age_min,
      prefAgeMax: myProfile.pref_age_max,
      prefEducation: myProfile.pref_education,
      prefOccupation: myProfile.pref_occupation,
    });

    matching.forEach(p => {
      try {
        const score = calculateMatchScore(myProfile, p);
        if (!score) return;
        const pct = score.percentage;
        if (pct >= 90) high++;
        else if (pct >= 50) medium++;
        if (pct <= 20) scoreBuckets[0].value++;
        else if (pct <= 40) scoreBuckets[1].value++;
        else if (pct <= 60) scoreBuckets[2].value++;
        else if (pct <= 80) scoreBuckets[3].value++;
        else scoreBuckets[4].value++;
      } catch (err) {
        console.error("Error calculating score for profile:", p.id, err);
      }
    });

    const newMembers = matching.filter(p => daysAgo(p.created_at) <= RECENT_DAYS).length;
    const recentlyActive = matching.filter(p => daysAgo(p.last_active_at) <= ACTIVE_DAYS).length;
    const nearby = matching.filter(p =>
      (myProfile.city && p.city && typeof myProfile.city === 'string' && typeof p.city === 'string' &&
       myProfile.city.trim().toLowerCase() === p.city.trim().toLowerCase()) ||
      (myProfile.district && p.district && typeof myProfile.district === 'string' && typeof p.district === 'string' &&
       myProfile.district.trim().toLowerCase() === p.district.trim().toLowerCase())
    ).length;

    console.log("Score buckets:", scoreBuckets);
    console.log("Match summary:", { total: matching.length, high, medium, newMembers, recentlyActive, nearby });
    console.log("Detailed counts:", {
      totalMatching: matching.length,
      highCompatibility: high,
      mediumCompatibility: medium,
      newMembersCount: newMembers,
      recentlyActiveCount: recentlyActive,
      nearbyCount: nearby,
    });

    // Matches by district — top 6 districts among the matching pool
    const districtCounts = {};
    matching.forEach(p => {
      const d = p.district && typeof p.district === 'string' ? p.district.trim() : "Other";
      districtCounts[d] = (districtCounts[d] || 0) + 1;
    });
    const districtChart = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label: label.length > 8 ? label.slice(0, 7) + "…" : label, value }));

    // Age-wise histogram — 5-year buckets
    const ageBuckets = {};
    matching.forEach(p => {
      if (!p.age) return;
      const bucketStart = Math.floor(p.age / 5) * 5;
      const key = `${bucketStart}-${bucketStart + 4}`;
      ageBuckets[key] = (ageBuckets[key] || 0) + 1;
    });
    const ageChart = Object.entries(ageBuckets)
      .sort((a, b) => Number(a[0].split("-")[0]) - Number(b[0].split("-")[0]))
      .map(([label, value]) => ({ label, value }));

    return {
      total: matching.length,
      high, medium, newMembers, recentlyActive, nearby,
      districtChart, ageChart, scoreBuckets,
    };
  } catch (err) {
    console.error("computeMatchAnalytics error:", err);
    return { total: 0, high: 0, medium: 0, newMembers: 0, recentlyActive: 0, nearby: 0, districtChart: [], ageChart: [], scoreBuckets: [] };
  }
}

function computeProfileViewsChart(viewRows) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS_TA[d.getMonth()], value: 0 });
  }
  const monthMap = Object.fromEntries(months.map(m => [m.key, m]));
  viewRows.forEach(row => {
    const d = new Date(row.viewed_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthMap[key]) monthMap[key].value++;
  });
  return months.map(({ label, value }) => ({ label, value }));
}

function computeInterestStatusChart(requests, userId, colors) {
  const sent = requests.filter(r => r.from_id === userId);
  const accepted = sent.filter(r => r.status === "accepted").length;
  const pending = sent.filter(r => r.status === "pending").length;
  const declined = sent.filter(r => r.status === "declined").length;
  return [
    { label: "Accepted / ஏற்கப்பட்டது", value: accepted, color: colors.approvedText },
    { label: "Pending / நிலுவையில்", value: pending, color: colors.pendingText },
    { label: "Declined / நிராகரிக்கப்பட்டது", value: declined, color: colors.rejectedText },
  ];
}

const COMPLETION_SECTIONS = [
  { key: "Basic", label: "Basic / அடிப்படை", fields: ["name", "gender", "age", "height", "religion", "caste", "sub_caste", "phone", "photo_url", "about"] },
  { key: "Education", label: "Education & Career / கல்வி", fields: ["education", "occupation", "income"] },
  { key: "Location", label: "Location / இருப்பிடம்", fields: ["address", "district", "city", "state", "mother_tongue"] },
  { key: "Family", label: "Family / குடும்பம்", fields: ["father_occupation", "mother_occupation", "siblings", "family_type"] },
  { key: "Horoscope", label: "Horoscope / ஜாதகம்", fields: ["star", "rasi", "birth_time", "birth_place"] },
  { key: "Physical", label: "Physical / உடல் அமைப்பு", fields: ["complexion", "body_type", "blood_group", "diet", "smoking", "drinking"] },
  { key: "Preference", label: "Preferences / விருப்பங்கள்", fields: ["pref_age_min", "pref_age_max", "pref_education", "pref_occupation"] },
];

function computeSectionCompletion(profile) {
  if (!profile) return [];
  return COMPLETION_SECTIONS.map(section => {
    const filled = section.fields.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== "").length;
    const pct = Math.round((filled / section.fields.length) * 100);
    return { label: section.label, value: pct };
  });
}

const COMPLETENESS_FIELDS = [
  "name", "gender", "age", "height", "religion", "caste", "sub_caste", "education",
  "occupation", "income", "address", "district", "city", "state", "mother_tongue",
  "phone", "photo_url", "about",
  "father_occupation", "mother_occupation", "siblings", "family_type",
  "star", "rasi", "birth_time", "birth_place",
  "complexion", "body_type", "blood_group",
  "diet", "smoking", "drinking",
  "pref_age_min", "pref_age_max", "pref_education", "pref_occupation",
];

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const filled = COMPLETENESS_FIELDS.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== "").length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

export default function Dashboard({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { session, profile, profileLoading, userId } = useAuth();
  const [pendingIncoming, setPendingIncoming] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [candidateProfiles, setCandidateProfiles] = useState([]);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);
  const [profileViews, setProfileViews] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchRequestsFor(userId).then(({ data }) => {
        setMyRequests(data);
        setPendingIncoming(data.filter(r => r.to_id === userId && r.status === "pending").length);
      });
      fetchNotifications(userId).then(({ data }) => {
        setUnreadNotifications(data.filter(n => !n.read).length);
      });
      fetchBlockedProfiles(userId).then(({ data }) => setBlockedIds(new Set(data.map(b => b.blocked_id))));
      fetchProfileViewsReceived(userId).then(({ data }) => setProfileViews(data));
    }
  }, [userId]);

  useEffect(() => {
    if (profile && profile.status === "approved") {
      setAnalyticsLoading(true);
      fetchApprovedProfiles().then(({ data }) => {
        console.log("Fetched candidate profiles:", data?.length);
        console.log("User profile:", profile);
        setCandidateProfiles(data || []);
        setAnalyticsLoading(false);
      });
    } else {
      setAnalyticsLoading(false);
    }
  }, [profile]);

  const analytics = useMemo(() => {
    if (!profile || profile.status !== "approved") return null;
    const pool = candidateProfiles.filter(p => !blockedIds.has(p.id));
    console.log("Candidate pool after filtering blocked:", pool.length);
    console.log("Total candidates:", candidateProfiles.length);
    console.log("Blocked IDs:", blockedIds.size);
    const result = computeMatchAnalytics(profile, pool);
    console.log("Analytics computed:", result);
    return result;
  }, [profile, candidateProfiles, blockedIds]);

  const profileViewsChart = useMemo(() => computeProfileViewsChart(profileViews), [profileViews]);
  const interestStatusChart = useMemo(() => computeInterestStatusChart(myRequests, userId, colors), [myRequests, userId, colors]);
  const completionChart = useMemo(() => computeSectionCompletion(profile), [profile]);

  if (!session) {
    return <Login onNavigate={onNavigate} showToast={showToast} />;
  }

  if (profileLoading) {
    return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;
  }

  const completeness = calculateCompleteness(profile);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Dashboard / டாஷ்போர்டு</h2>

      {!profile && (
        <div style={{ textAlign: "center", padding: "30px 16px", background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}`, marginBottom: 16 }}>
          <div style={{ color: colors.text, fontWeight: 600, marginBottom: 6 }}>No profile yet / விவரம் இல்லை</div>
          <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 14 }}>Complete your profile to start receiving interest requests. / விவரத்தை பூர்த்தி செய்யவும்.</div>
          <button onClick={() => onNavigate("editProfile")} style={{
            background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
            padding: "10px 18px", fontWeight: 700, fontSize: 14,
          }}>Complete profile / விவரத்தை பூர்த்தி செய்யவும்</button>
        </div>
      )}

      {profile && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div onClick={() => onNavigate("editProfile")} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: 12 }}>
            <Avatar name={profile.name} gender={profile.gender} photoUrl={profile.photo_url} />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
              <div style={{ fontSize: 12.5, color: colors.textFaint }}>{profile.city} · {profile.age} yrs</div>
            </div>
            <Badge tone={profile.status === "approved" ? "approved" : profile.status === "rejected" ? "rejected" : "pending"}>
              {profile.status}
            </Badge>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, color: colors.textFaint }}>Profile completeness / விவர முழுமை</span>
              <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 700 }}>{completeness}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: colors.pendingBg, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${completeness}%`, borderRadius: 999,
                background: completeness === 100 ? colors.approvedText : colors.accent,
                transition: "width 0.3s ease",
              }} />
            </div>
            {completeness < 100 && (
              <button onClick={() => onNavigate("editProfile")} style={{
                background: "none", border: "none", color: colors.primary, fontSize: 11.5, fontWeight: 700,
                padding: 0, marginTop: 6,
              }}>Complete more details →</button>
            )}
          </div>

          {profile.status === "approved" && (
            <button onClick={() => setShowShareModal(true)} style={{
              width: "100%", marginTop: 12, background: colors.pendingBg, color: colors.pendingText,
              border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: 12.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Share2 size={13} /> Share my profile / சுயவிவரத்தை பகிரவும்
            </button>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <DashCard icon={Heart} title="Interest Requests / ஆர்வ கோரிக்கைகள்" badge={pendingIncoming > 0 ? pendingIncoming : null} onClick={() => onNavigate("requests")} colors={colors} />
        <DashCard icon={Bell} title="Notifications / அறிவிப்புகள்" badge={unreadNotifications > 0 ? unreadNotifications : null} onClick={() => onNavigate("notifications")} colors={colors} />
        <DashCard icon={ShieldCheck} title="Favourites / பிடித்தவை" onClick={() => onNavigate("favourites")} colors={colors} />
        <DashCard icon={Clock} title="Recently Viewed / சமீபத்தியவை" onClick={() => onNavigate("recentlyViewed")} colors={colors} />
        <DashCard icon={Mail} title="Contact Us / தொடர்பு கொள்ள" onClick={() => onNavigate("contact")} colors={colors} />
        <DashCard icon={Settings} title="Account Settings / அமைப்புகள்" onClick={() => onNavigate("accountSettings")} colors={colors} />
        <DashCard icon={HelpCircle} title="FAQ / கேள்விகள்" onClick={() => onNavigate("faq")} colors={colors} />
      </div>

      {profile && profile.status === "approved" && (
        <div style={{ marginBottom: 16 }}>
          <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 10, color: colors.primary }}>
            Match Analytics / பொருத்த புள்ளிவிவரம்
          </h3>
          {analyticsLoading ? (
            <div style={{ textAlign: "center", color: colors.textFaint, padding: 20, fontSize: 12.5 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatCard icon={Users} label="Total Matching Profiles / மொத்த பொருத்தமான விவரங்கள்" value={analytics.total} colors={colors} onClick={() => onNavigate("browse")} />
              <StatCard icon={Sparkles} label="High Compatibility (90%+) / அதிக பொருத்தம்" value={analytics.high} colors={colors} tone="approved" onClick={() => onNavigate("browse")} />
              <StatCard icon={TrendingUp} label="Medium Compatibility / நடுத்தர பொருத்தம்" value={analytics.medium} colors={colors} tone="pending" onClick={() => onNavigate("browse")} />
              <StatCard icon={UserPlus} label="New Members Matching Preference / புதிய பொருத்தமான உறுப்பினர்கள்" value={analytics.newMembers} colors={colors} onClick={() => onNavigate("browse")} />
              <StatCard icon={Activity} label="Recently Active Matches / சமீபத்தில் செயலில் இருந்தவர்கள்" value={analytics.recentlyActive} colors={colors} onClick={() => onNavigate("browse")} />
              <StatCard icon={MapPin} label="Nearby Matches / அருகிலுள்ள பொருத்தங்கள்" value={analytics.nearby} colors={colors} onClick={() => onNavigate("browse")} />
            </div>
          )}
        </div>
      )}

      {profile && profile.status === "approved" && (
        <div style={{ marginBottom: 8 }}>
          <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 10, color: colors.primary, display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart3 size={16} /> Your Insights / உங்கள் புள்ளிவிவரங்கள்
          </h3>

          <ChartCard title="📈 Monthly Profile Views / மாதாந்திர பார்வைகள்" subtitle="Last 6 months / கடந்த 6 மாதங்கள்" colors={colors}>
            <LineChart data={profileViewsChart} colors={colors} />
          </ChartCard>

          <ChartCard title="🥧 Interest Status / ஆர்வ கோரிக்கை நிலை" subtitle="Requests you sent / நீங்கள் அனுப்பியவை" colors={colors}>
            <DonutChart segments={interestStatusChart} colors={colors} />
          </ChartCard>

          <ChartCard title="📊 Profile Completion by Section / பிரிவு வாரியாக முழுமை" colors={colors}>
            <BarChart data={completionChart} colors={colors} />
          </ChartCard>

          {!analyticsLoading && analytics && (
            <>
              <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Match Summary / பொருத்த சுருக்கம்</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: colors.primary }}>{analytics.total}</div>
                    <div style={{ color: colors.textFaint }}>Total Matches</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: colors.approvedText }}>{analytics.high}</div>
                    <div style={{ color: colors.textFaint }}>High (90%+)</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: colors.pendingText }}>{analytics.medium}</div>
                    <div style={{ color: colors.textFaint }}>Medium (50%+)</div>
                  </div>
                </div>
              </div>

              <ChartCard title="📍 Matches by District / மாவட்டம் வாரியாக பொருத்தங்கள்" colors={colors}>
                {analytics.districtChart && analytics.districtChart.length > 0 ? (
                  <BarChart data={analytics.districtChart} colors={colors} barColor={colors.accent} />
                ) : (
                  <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
                    No district data available
                  </div>
                )}
              </ChartCard>

              <ChartCard title="👥 Age-wise Matching Profiles / வயது வாரியாக பொருத்தங்கள்" colors={colors}>
                {analytics.ageChart && analytics.ageChart.length > 0 ? (
                  <BarChart data={analytics.ageChart} colors={colors} />
                ) : (
                  <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
                    No age data available
                  </div>
                )}
              </ChartCard>

              <ChartCard title="⭐ Compatibility Score Distribution / பொருத்த மதிப்பெண் பரவல்" colors={colors}>
                {analytics.scoreBuckets && analytics.scoreBuckets.length > 0 ? (
                  <BarChart data={analytics.scoreBuckets} colors={colors} barColor={colors.approvedText} />
                ) : (
                  <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
                    No score data available
                  </div>
                )}
              </ChartCard>

              {!analytics.districtChart?.length && !analytics.ageChart?.length && !analytics.scoreBuckets?.length && (
                <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 20, textAlign: "center", fontSize: 13, color: colors.textFaint }}>
                  <div style={{ marginBottom: 8 }}>No matching profiles found yet. / பொருத்தமான விவரங்கள் இல்லை</div>
                  <div style={{ fontSize: 11.5, color: colors.textMuted }}>
                    Total matches: {analytics.total} | High: {analytics.high} | Medium: {analytics.medium}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>
                    District chart: {analytics.districtChart?.length || 0} | Age chart: {analytics.ageChart?.length || 0} | Score buckets: {analytics.scoreBuckets?.length || 0}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showShareModal && profile && (
        <ShareProfileModal profileId={profile.id} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, colors, children }) {
  return (
    <div style={{
      background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14,
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, marginBottom: subtitle ? 2 : 10 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colors, tone, onClick }) {
  const valueColor = tone === "approved" ? colors.approvedText : tone === "pending" ? colors.pendingText : colors.primary;
  return (
    <button onClick={onClick} style={{
      background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14,
      textAlign: "left",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Icon size={17} color={colors.primary} />
        <span style={{ fontSize: 20, fontWeight: 800, color: valueColor, fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</span>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: colors.textFaint, lineHeight: 1.35 }}>{label}</div>
    </button>
  );
}

function DashCard({ icon: Icon, title, badge, onClick, colors }) {
  return (
    <button onClick={onClick} style={{
      background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16,
      textAlign: "left", position: "relative",
    }}>
      <Icon size={20} color={colors.primary} style={{ marginBottom: 8 }} />
      <div style={{ fontWeight: 700, fontSize: 13.5, color: colors.text }}>{title}</div>
      {badge && (
        <span style={{
          position: "absolute", top: 10, right: 10, background: colors.rejectedText, color: "#fff",
          borderRadius: 999, fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
        }}>{badge}</span>
      )}
    </button>
  );
}
