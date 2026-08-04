import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const FAQ_SECTIONS = [
  {
    category: "Registration & Account / பதிவு மற்றும் கணக்கு",
    items: [
      {
        q: "How do I register?",
        qTa: "எப்படி பதிவு செய்வது?",
        a: "Click 'Register' on the Home page, fill in your basic details (name, age, caste, occupation, address, phone, etc.), then create a login using either Email OTP or Phone + password.",
        aTa: "Home page-ல் 'Register' கிளிக் செய்து, அடிப்படை விவரங்களை நிரப்பி, Email OTP அல்லது Phone + password மூலம் கணக்கை உருவாக்கவும்.",
      },
      {
        q: "Why do I need admin approval?",
        qTa: "நிர்வாகி அனுமதி ஏன் தேவை?",
        a: "Every new profile is reviewed by an admin before it becomes visible to other members. This helps keep the community genuine and free of fake profiles.",
        aTa: "ஒவ்வொரு புதிய விவரமும் நிர்வாகியால் சரிபார்க்கப்பட்ட பின்னரே மற்ற உறுப்பினர்களுக்குத் தெரியும். இது சமூகத்தை உண்மையானதாக வைத்திருக்க உதவுகிறது.",
      },
      {
        q: "I forgot my password. What do I do?",
        qTa: "கடவுச்சொல் மறந்துவிட்டது, என்ன செய்வது?",
        a: "On the Login page, click 'Forgot password?'. If you registered with Email, enter your email + the mother's name you set. If you registered with Phone, enter your phone number + mother's name. No OTP or email link is needed for this.",
        aTa: "Login பக்கத்தில் 'Forgot password?' கிளிக் செய்யவும். மின்னஞ்சல்/தொலைபேசி எண் + தாயின் பெயரை உள்ளிட்டு மீட்டமைக்கலாம்.",
      },
      {
        q: "Can I create a profile for my son or daughter?",
        qTa: "என் மகன்/மகளுக்காக விவரம் உருவாக்கலாமா?",
        a: "Yes. When registering, select 'This profile is for' and choose Son or Daughter instead of Self.",
        aTa: "ஆம். பதிவு செய்யும்போது 'இந்த விவரம் யாருக்காக' என்பதில் மகன்/மகள் தேர்ந்தெடுக்கலாம்.",
      },
    ],
  },
  {
    category: "Privacy & Safety / தனியுரிமை மற்றும் பாதுகாப்பு",
    items: [
      {
        q: "Who can see my phone number?",
        qTa: "என் தொலைபேசி எண்ணை யார் பார்க்க முடியும்?",
        a: "Your phone number is only ever visible to the admin, for verification purposes. It is never shown to other members, even after an interest request is accepted.",
        aTa: "உங்கள் தொலைபேசி எண் நிர்வாகிக்கு மட்டுமே தெரியும். மற்ற உறுப்பினர்களுக்கு ஒருபோதும் காட்டப்படாது.",
      },
      {
        q: "When does my address become visible to someone?",
        qTa: "என் முகவரி எப்போது தெரியும்?",
        a: "Your address (city, district, state) is shared with another member only after you both send and accept an interest request with each other.",
        aTa: "இருதரப்பும் ஆர்வக் கோரிக்கையை ஏற்றுக்கொண்ட பிறகே உங்கள் முகவரி பகிரப்படும்.",
      },
      {
        q: "Can I block or report someone?",
        qTa: "ஒருவரை தடுக்கவோ புகார் செய்யவோ முடியுமா?",
        a: "Yes. On any profile page, use the 'Block' button to stop seeing that profile in Browse, or 'Report' to flag inappropriate behaviour to the admin.",
        aTa: "ஆம். எந்த விவரப் பக்கத்திலும் 'Block' அல்லது 'Report' பொத்தானைப் பயன்படுத்தலாம்.",
      },
      {
        q: "What happens if I don't log in for a long time?",
        qTa: "நீண்ட காலம் உள்நுழையாவிட்டால் என்ன ஆகும்?",
        a: "If your account is inactive for more than 150 days, browsing is paused for your account's safety. Simply log in again to resume normal access.",
        aTa: "150 நாட்களுக்கும் மேலாக உள்நுழையாவிட்டால், பாதுகாப்பிற்காக பார்வையிடுதல் இடைநிறுத்தப்படும். மீண்டும் உள்நுழைந்தால் சரியாகிவிடும்.",
      },
    ],
  },
  {
    category: "Matching & Browsing / பொருத்தம் மற்றும் தேடல்",
    items: [
      {
        q: "Why do I only see profiles of the opposite gender?",
        qTa: "எதிர் பாலினத்தினரின் விவரங்கள் மட்டும் ஏன் தெரிகிறது?",
        a: "The Browse page automatically shows only opposite-gender profiles that are relevant for matrimonial matching.",
        aTa: "திருமணப் பொருத்தத்திற்கு ஏற்ப, Browse பக்கம் எதிர் பாலினத்தினரை மட்டுமே தானாகக் காட்டும்.",
      },
      {
        q: "What is the 'Match Score'?",
        qTa: "'Match Score' என்றால் என்ன?",
        a: "It's a percentage showing how well a profile matches your stated preferences (age range, education, occupation) and other details like sub-caste and location.",
        aTa: "உங்கள் விருப்பங்களுக்கு (வயது, கல்வி, தொழில்) மற்றும் பிற விவரங்களுக்கு எவ்வளவு பொருந்துகிறது என்பதைக் காட்டும் சதவீதம்.",
      },
      {
        q: "What is 'Porutham'?",
        qTa: "'பொருத்தம்' என்றால் என்ன?",
        a: "Porutham is traditional Tamil horoscope matching based on birth Star and Rasi, calculated across 10 factors (Dina, Gana, Mahendra, and others). It's a helpful reference — please also consult a family astrologer for important decisions.",
        aTa: "நட்சத்திரம் மற்றும் ராசி அடிப்படையிலான பாரம்பரிய ஜாதக பொருத்தம், 10 அம்சங்களில் கணக்கிடப்படும். முக்கிய முடிவுகளுக்கு ஜோதிடரையும் அணுகவும்.",
      },
      {
        q: "Why can't I see some fields in a profile?",
        qTa: "சில விவரங்கள் ஏன் தெரியவில்லை?",
        a: "If a member hasn't filled in optional details (like horoscope or family information), those sections simply won't appear on their profile.",
        aTa: "உறுப்பினர் விருப்பமான விவரங்களை (ஜாதகம், குடும்பம் போன்றவை) நிரப்பவில்லை என்றால், அவை காட்டப்படாது.",
      },
    ],
  },
  {
    category: "Interest Requests / ஆர்வ கோரிக்கைகள்",
    items: [
      {
        q: "How do I express interest in someone?",
        qTa: "ஒருவரிடம் எப்படி ஆர்வம் தெரிவிப்பது?",
        a: "Open their profile and tap 'Send interest request'. They will get a notification and can accept or decline.",
        aTa: "அவர்களின் விவரத்தைத் திறந்து 'Send interest request' தட்டவும். அவர்களுக்கு அறிவிப்பு செல்லும்.",
      },
      {
        q: "What happens when someone accepts my request?",
        qTa: "யாராவது என் கோரிக்கையை ஏற்றுக்கொண்டால் என்ன ஆகும்?",
        a: "You'll get a notification, and their address becomes visible to you (and yours to them). Their phone number still stays private — only the admin has it.",
        aTa: "உங்களுக்கு அறிவிப்பு வரும், மற்றும் இருவரின் முகவரியும் தெரியும். தொலைபேசி எண் தனியுரிமையுடன் இருக்கும்.",
      },
    ],
  },
  {
    category: "General / பொது",
    items: [
      {
        q: "Is Naicker Matrimony free to use?",
        qTa: "இந்த தளம் இலவசமா?",
        a: "Yes, currently all features are completely free. If paid plans are introduced in the future, existing users will be notified in advance.",
        aTa: "ஆம், தற்போது அனைத்து அம்சங்களும் முற்றிலும் இலவசம். எதிர்காலத்தில் கட்டண திட்டங்கள் வந்தால் முன்கூட்டியே அறிவிக்கப்படும்.",
      },
      {
        q: "How do I delete my account?",
        qTa: "என் கணக்கை எப்படி நீக்குவது?",
        a: "Go to Dashboard → Account Settings → Danger Zone → Delete my account. This is permanent and cannot be undone.",
        aTa: "Dashboard → Account Settings → Danger Zone → Delete my account. இது நிரந்தரமானது.",
      },
      {
        q: "I have a question that's not answered here.",
        qTa: "இங்கு பதில் இல்லாத கேள்வி இருந்தால்?",
        a: "Use the Contact Us page from your Dashboard to send us a message, and we'll get back to you.",
        aTa: "Dashboard-இல் உள்ள Contact Us பக்கம் மூலம் எங்களுக்குச் செய்தி அனுப்பவும்.",
      },
    ],
  },
];

export default function FAQ() {
  const { colors } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(key) {
    setOpenIndex(prev => (prev === key ? null : key));
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <HelpCircle size={28} color={colors.primary} style={{ marginBottom: 8 }} />
        <h2 className="serif" style={{ fontSize: 19, margin: 0 }}>Frequently Asked Questions</h2>
        <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>அடிக்கடி கேட்கப்படும் கேள்விகள்</div>
      </div>

      {FAQ_SECTIONS.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: 20 }}>
          <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
            {section.category}
          </div>
          <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`;
              const isOpen = openIndex === key;
              return (
                <div key={key} style={{ borderBottom: iIdx < section.items.length - 1 ? `1px solid ${colors.cardBorder}` : "none" }}>
                  <button onClick={() => toggle(key)} style={{
                    width: "100%", background: "none", border: "none", padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text, paddingRight: 10 }}>
                      {item.q}
                      <div style={{ fontSize: 11, color: colors.textFaint, fontWeight: 400, marginTop: 2 }}>{item.qTa}</div>
                    </span>
                    <ChevronDown
                      size={16}
                      color={colors.textFaint}
                      style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>{item.a}</div>
                      <div style={{ fontSize: 12, color: colors.textFaint, lineHeight: 1.6, marginTop: 6 }}>{item.aTa}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
