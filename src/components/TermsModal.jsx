import { X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const SECTIONS = [
  {
    en: "1. Eligibility", ta: "தகுதி",
    items: [
      ["You must be at least 18 years of age.", "உங்களுக்குக் குறைந்தது 18 வயது பூர்த்தியாகியிருக்க வேண்டும்."],
      ["You must be legally eligible to marry under the applicable laws.", "பொருந்தக்கூடிய சட்டங்களின் கீழ் திருமணம் செய்துகொள்ள உங்களுக்குச் சட்டப்பூர்வத் தகுதி இருக்க வேண்டும்."],
      ["You must provide accurate, complete, and truthful information.", "நீங்கள் துல்லியமான, முழுமையான மற்றும் உண்மையான தகவல்களை வழங்க வேண்டும்."],
    ],
  },
  {
    en: "2. Registration & Account", ta: "பதிவு மற்றும் கணக்கு",
    items: [
      ["One person may maintain only one account unless otherwise approved by us.", "எங்களால் வேறுவிதமாக அங்கீகரிக்கப்பட்டாலன்றி, ஒரு நபர் ஒரு கணக்கை மட்டுமே வைத்திருக்க முடியும்."],
      ["You are responsible for maintaining the confidentiality of your login credentials.", "உங்கள் உள்நுழைவு விவரங்களின் ரகசியத்தன்மையைப் பாதுகாப்பதற்கு நீங்களே பொறுப்பாவீர்கள்."],
      ["You are responsible for all activities carried out using your account.", "உங்கள் கணக்கைப் பயன்படுத்தி மேற்கொள்ளப்படும் அனைத்து நடவடிக்கைகளுக்கும் நீங்களே பொறுப்பாவீர்கள்."],
    ],
  },
  {
    en: "3. User Information", ta: "பயனர் தகவல்",
    items: [
      ["Users are solely responsible for the accuracy of their profile information.", "பயனர்கள் தங்கள் சுயவிவரத் தகவலின் துல்லியத்திற்கு முழுப் பொறுப்பாவார்கள்."],
      ["We do not guarantee or verify every profile unless explicitly marked as verified.", "சரிபார்க்கப்பட்டது எனத் தெளிவாகக் குறிக்கப்பட்டாலன்றி, ஒவ்வொரு சுயவிவரத்திற்கும் நாங்கள் உத்தரவாதம் அளிப்பதில்லை."],
      ["Users must independently verify information before making any personal or matrimonial decisions.", "பயனர்கள் எந்தவொரு முடிவையும் எடுப்பதற்கு முன்பு, தகவல்களைச் சுயமாகச் சரிபார்க்க வேண்டும்."],
    ],
  },
  {
    en: "4. Free Membership", ta: "இலவச உறுப்பினர்",
    items: [
      ["Free members may: register an account, create a profile, upload photographs (subject to approval), browse eligible profiles, and receive limited matches.", "இலவச உறுப்பினர்கள் கணக்குப் பதிவு, சுயவிவரம் உருவாக்கம், புகைப்படப் பதிவேற்றம் (அங்கீகாரத்திற்கு உட்பட்டது), பொருத்தமான சுயவிவரப் பார்வை மற்றும் வரையறுக்கப்பட்ட பொருத்தங்களைப் பெறலாம்."],
    ],
  },
  {
    en: "5. Paid Membership (Future)", ta: "கட்டண உறுப்பினர் (எதிர்காலம்)",
    items: [
      ["Paid members may in future receive additional benefits including unlimited profile viewing, contact details, premium search filters, priority support, and enhanced visibility.", "எதிர்காலத்தில் கட்டணம் செலுத்திய உறுப்பினர்கள் வரம்பற்ற சுயவிவரப் பார்வை, தொடர்பு விவரங்கள், சிறப்புத் தேடல் வடிகட்டிகள், முன்னுரிமை சேவை மற்றும் மேம்படுத்தப்பட்ட தெரிவுநிலை உள்ளிட்ட கூடுதல் பலன்களைப் பெறலாம்."],
      ["Premium benefits are available only during the active subscription period.", "இந்தச் சிறப்புப் பலன்கள், சந்தா செயல்பாட்டில் இருக்கும் காலப்பகுதியில் மட்டுமே கிடைக்கும்."],
    ],
  },
  {
    en: "6. Payment & Refund Policy", ta: "கட்டணம் மற்றும் திருப்பிச் செலுத்துதல்",
    items: [
      ["Subscription fees must be paid in advance and are processed through authorised payment gateways.", "சந்தாக் கட்டணங்கள் முன்கூட்டியே, அங்கீகரிக்கப்பட்ட கட்டண நுழைவாயில்கள் மூலம் செலுத்தப்பட வேண்டும்."],
      ["Fees are generally non-refundable unless required by applicable law or our published refund policy.", "பொருந்தக்கூடிய சட்டம் அல்லது எங்கள் திருப்பிச் செலுத்தும் கொள்கையின்படி தேவைப்பட்டாலன்றி, கட்டணங்கள் பொதுவாகத் திரும்பப்பெறப்படாது."],
      ["Chargebacks or fraudulent payment disputes may result in suspension or termination of your account.", "கட்டணத் திருப்பங்கள் அல்லது மோசடியான தகராறுகள் உங்கள் கணக்கை இடைநிறுத்தம் செய்யலாம்."],
    ],
  },
  {
    en: "7. Privacy", ta: "தனியுரிமை",
    items: [
      ["Your personal information will be handled in accordance with our Privacy Policy.", "உங்கள் தனிப்பட்ட தகவல்கள் எங்கள் தனியுரிமைக் கொள்கையின்படி கையாளப்படும்."],
      ["We implement reasonable security measures, but no online platform can guarantee absolute security.", "நாங்கள் நியாயமான பாதுகாப்பு நடவடிக்கைகளைச் செயல்படுத்தினாலும், முழுமையான பாதுகாப்பிற்கு உத்தரவாதம் அளிக்க முடியாது."],
      ["Users should avoid sharing sensitive financial or identity information with other users.", "பயனர்கள் முக்கியமான நிதி அல்லது அடையாளத் தகவல்களை மற்ற பயனர்களுடன் பகிர்வதைத் தவிர்க்க வேண்டும்."],
    ],
  },
  {
    en: "8. Prohibited Activities", ta: "தடைசெய்யப்பட்ட செயல்கள்",
    items: [
      ["Users shall not: create fake profiles; upload false or misleading information; use abusive, offensive, or illegal language; harass, threaten, or blackmail other users; request money or engage in financial fraud; impersonate another person; scrape or misuse platform data; or use bots/scripts without permission.", "பயனர்கள் போலி சுயவிவரங்கள் உருவாக்குதல், தவறான தகவல் பதிவேற்றுதல், வசைச்சொற்கள் பயன்படுத்துதல், துன்புறுத்துதல் அல்லது மிரட்டுதல், பணம் கோருதல் அல்லது மோசடி, ஆள்மாறாட்டம், தரவு நகலெடுத்தல் அல்லது அனுமதியின்றி பாட்/ஸ்கிரிப்ட் பயன்படுத்துதல் ஆகியவற்றைச் செய்யக்கூடாது."],
      ["Violation of these rules may result in immediate suspension or permanent termination.", "இந்த விதிகளை மீறினால், உடனடியாக இடைநீக்கம் அல்லது நிரந்தர நீக்கம் செய்யப்படலாம்."],
    ],
  },
  {
    en: "9. Profile Verification", ta: "சுயவிவர சரிபார்ப்பு",
    items: [
      ["Verification does not guarantee the character, behaviour, financial status, medical condition, or marital suitability of any member.", "சரிபார்ப்பு என்பது எந்தவொரு உறுப்பினரின் குணம், நடத்தை, நிதி நிலை அல்லது திருமணப் பொருத்தத்திற்கு உத்தரவாதம் அளிக்காது."],
      ["Users must conduct their own due diligence before proceeding with any matrimonial decision.", "திருமணம் தொடர்பான முடிவை எடுப்பதற்கு முன், பயனர்கள் சுயமாக உரிய ஆய்வுகளை மேற்கொள்ள வேண்டும்."],
    ],
  },
  {
    en: "10. Communication", ta: "தொடர்பு",
    items: [
      ["By registering, you agree to receive SMS, email, WhatsApp messages (where permitted), push notifications, and customer support communications.", "பதிவு செய்வதன் மூலம், SMS, மின்னஞ்சல், WhatsApp செய்திகள், Push அறிவிப்புகள் மற்றும் வாடிக்கையாளர் சேவைத் தொடர்புகளைப் பெற ஒப்புக்கொள்கிறீர்கள்."],
      ["You may opt out of promotional communications where applicable.", "பொருந்தக்கூடிய இடங்களில், விளம்பரத் தொடர்புகளைப் பெறுவதிலிருந்து விலகிக்கொள்ளலாம்."],
    ],
  },
  {
    en: "11. Intellectual Property", ta: "அறிவுசார் சொத்து உரிமை",
    items: [
      ["All website content, logos, trademarks, software, graphics, and designs belong to Naicker Matrimony unless otherwise stated.", "வேறுவிதமாகக் குறிப்பிடப்படாதவரை, இணையதளத்தின் அனைத்து உள்ளடக்கங்களும், சின்னங்களும், வடிவமைப்புகளும் Naicker Matrimony-க்குச் சொந்தமானவை."],
      ["Unauthorised copying or commercial use is prohibited.", "அனுமதியின்றி நகலெடுப்பதோ வணிக ரீதியாகப் பயன்படுத்துவதோ தடைசெய்யப்பட்டுள்ளது."],
    ],
  },
  {
    en: "12. Suspension & Termination", ta: "கணக்கு நிறுத்தம்",
    items: [
      ["We reserve the right to suspend accounts, remove profiles, delete content, or permanently terminate memberships without prior notice where there is fraud, abuse, or violation of these Terms.", "மோசடி, முறைகேடு அல்லது இந்த விதிமுறைகளை மீறும் பட்சத்தில், முன் அறிவிப்பின்றி கணக்குகளை இடைநிறுத்தவோ, சுயவிவரங்களை நீக்கவோ, நிரந்தரமாக ரத்து செய்யவோ உரிமை உண்டு."],
    ],
  },
  {
    en: "13. Disclaimer", ta: "பொறுப்பு வரம்பு",
    items: [
      ["We act only as an online matrimonial platform that facilitates introductions. We do not guarantee marriage, compatibility, profile accuracy, member behaviour, financial background, or character/family verification.", "நாங்கள் அறிமுகங்களைச் சாத்தியமாக்கும் ஒரு இணையவழித் திருமணத் தகவல் தளமாக மட்டுமே செயல்படுகிறோம். திருமணம், பொருத்தம், சுயவிவரத் துல்லியம், நடத்தை அல்லது பின்னணி சரிபார்ப்புக்கு உத்தரவாதம் அளிப்பதில்லை."],
      ["Users assume full responsibility for communications, meetings, and matrimonial decisions.", "தகவல் பரிமாற்றங்கள், சந்திப்புகள் மற்றும் திருமண முடிவுகளுக்குப் பயனர்களே முழுப் பொறுப்பாவார்கள்."],
    ],
  },
  {
    en: "14. Limitation of Liability", ta: "பொறுப்பு வரம்பு",
    items: [
      ["To the maximum extent permitted by law, Naicker Matrimony shall not be liable for direct or indirect losses, emotional distress, fraud by other users, financial loss, identity theft, or failed matrimonial alliances.", "சட்டத்தால் அனுமதிக்கப்பட்ட வரம்பிற்கு உட்பட்டு, நேரடி/மறைமுக இழப்புகள், மன உளைச்சல், பிற பயனர் மோசடி, நிதி இழப்பு, அடையாளத் திருட்டு அல்லது தோல்வியடைந்த உறவு முயற்சிகளுக்குப் பொறுப்பேற்காது."],
    ],
  },
  {
    en: "15. Governing Law", ta: "பொருந்தும் சட்டம்",
    items: [
      ["These Terms shall be governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Sathyamangalam, Gobichettipalayam, Erode, Tamil Nadu.", "இவ்விதிமுறைகள் இந்தியச் சட்டங்களுக்கு உட்பட்டவை. தகராறுகள் சத்தியமங்கலம், கோபிச்செட்டிப்பாளையம், ஈரோடு, தமிழ்நாடு நீதிமன்றங்களின் பிரத்யேக அதிகார வரம்பிற்கு உட்பட்டவை."],
    ],
  },
  {
    en: "16. Changes to Terms", ta: "விதிமுறைகளில் மாற்றங்கள்",
    items: [
      ["We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the revised Terms.", "நாங்கள் எப்போது வேண்டுமானாலும் இச்சரத்துகளை மாற்றியமைக்கலாம். மாற்றங்களுக்குப் பிறகும் தொடர்ந்து பயன்படுத்துவது, திருத்தப்பட்ட விதிமுறைகளை ஏற்றுக்கொள்வதாகக் கருதப்படும்."],
    ],
  },
  {
    en: "17. Free Service (Current)", ta: "இலவச சேவை (தற்போது)",
    items: [
      ["At present, Naicker Matrimony is offered as a free service. Users can register, create a profile, browse profiles, and use available features without any membership fee.", "தற்போது Naicker Matrimony-இன் அனைத்து அடிப்படை சேவைகளும் இலவசமாக வழங்கப்படுகின்றன. பயனர்கள் கட்டணமின்றி பதிவு செய்து, சுயவிவரம் உருவாக்கி, வசதிகளைப் பயன்படுத்தலாம்."],
      ["As the platform grows, we reserve the right to introduce paid membership plans. Any such changes will be announced in advance, and existing users will be notified before paid services are implemented.", "எதிர்காலத்தில், பிரீமியம் உறுப்பினர் திட்டங்களை அறிமுகப்படுத்தும் உரிமை எங்களுக்கு உண்டு. இதுபற்றிய மாற்றங்கள் முன்கூட்டியே அறிவிக்கப்பட்டு, தற்போதைய பயனர்களுக்கும் அறிவிப்பு வழங்கப்படும்."],
    ],
  },
  {
    en: "18. Contact Us", ta: "தொடர்புக்கு",
    items: [
      ["Address: Kethampalayam, Mettukadai, Ukkaram, Sathyamangalam", "முகவரி: கேத்தம்பாளையம், மேட்டுக்காடை, உக்காரம், சத்தியமங்கலம்"],
      ["Email: cpaarthy@gmail.com | Phone: +91 8344533583", "மின்னஞ்சல்: cpaarthy@gmail.com | தொலைபேசி: +91 8344533583"],
      ["Website: https://naicker-matrimony.vercel.app/", "இணையதளம்: https://naicker-matrimony.vercel.app/"],
    ],
  },
];

export default function TermsModal({ onClose }) {
  const { colors } = useTheme();

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
    }}>
      <div style={{
        background: colors.bg, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          background: colors.headerGradient, color: colors.headerText, padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div className="serif" style={{ fontWeight: 800, fontSize: 16 }}>Terms & Conditions</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>பயன்பாட்டு விதிமுறைகள்</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", color: colors.headerText,
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 18px 8px" }}>
          <p style={{ fontSize: 11.5, color: colors.textFaint, marginBottom: 16, lineHeight: 1.6 }}>
            Effective Date: 01/08/2026. By using Naicker Matrimony, you agree to be bound by these Terms.
            <br />நடைமுறைக்கு வரும் தேதி: 01/08/2026. Naicker Matrimony-ஐப் பயன்படுத்துவதன் மூலம், இந்த விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.
          </p>

          {SECTIONS.map((section, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 13.5, color: colors.primary, marginBottom: 2 }}>
                {section.en}
              </div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>{section.ta}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {section.items.map(([en, ta], j) => (
                  <li key={j} style={{ fontSize: 12, color: colors.text, lineHeight: 1.6, marginBottom: 8 }}>
                    {en}
                    <div style={{ color: colors.textFaint, fontSize: 11 }}>{ta}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 18px", borderTop: `1px solid ${colors.cardBorder}` }}>
          <button onClick={onClose} style={{
            width: "100%", background: colors.primary, color: colors.primaryText, border: "none",
            borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14,
          }}>
            Close / மூடு
          </button>
        </div>
      </div>
    </div>
  );
}
