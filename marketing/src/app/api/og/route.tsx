import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';

  const titles: Record<string, string> = {
    en: 'RAISE — Report • Amplify • Inform • Solve • Escalate',
    mr: 'RAISE — नोंदवा • आवाज उठवा • माहिती द्या • निवारण करा • पाठपुरावा करा',
    hi: 'RAISE — दर्ज करें • आवाज बढ़ाएं • सूचित करें • समाधान पाएं • एस्केलेट करें',
  };

  const taglines: Record<string, string> = {
    en: 'Every Citizen’s Voice. Every Authority’s Duty.',
    mr: 'प्रत्येक नागरिकाचा आवाज. प्रत्येक प्रशासनाचे कर्तव्य.',
    hi: 'हर नागरिक की आवाज. हर प्रशासन का कर्तव्य.',
  };

  const title = titles[lang] || titles.en;
  const tagline = taglines[lang] || taglines.en;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ea580c',
          color: 'white',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              backgroundColor: 'white',
              color: '#ea580c',
              fontSize: '48px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 900,
              letterSpacing: '-1px',
            }}
          >
            RAISE
          </span>
        </div>

        <div
          style={{
            fontSize: '34px',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '20px',
            color: '#fff',
            maxWidth: '1000px',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: '#ffedd5',
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
