import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Civic Grievance';
    const raises = searchParams.get('raises') || '1';
    const tier = searchParams.get('tier') || '1';
    const status = searchParams.get('status') || 'submitted';
    const settlement = searchParams.get('settlement') || 'Gram Panchayat';
    const category = searchParams.get('category') || 'Community Infrastructure';

    const tierLabels: Record<string, string> = {
      '1': 'Tier 1: Gram Panchayat / Ward Office',
      '2': 'Tier 2: Taluka BDO / Municipal Commissioner',
      '3': 'Tier 3: Zilla Parishad CEO / District Collector',
      '4': 'Tier 4: State Ministry / CM Dashboard',
      '5': 'Tier 5: PMO PRAGATI Redressal',
    };
    const tierName = tierLabels[tier] || `Tier ${tier}/5 Escalation Pyramid`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0a0f1d',
            padding: '50px 60px',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                }}
              >
                RAISE
              </div>
              <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500 }}>
                Citizens • Verification • Accountability
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <span
                style={{
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  border: '1px solid #334155',
                }}
              >
                {settlement}
              </span>
              <span
                style={{
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: 600,
                  border: '1px solid #334155',
                }}
              >
                {category.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Issue Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '30px 0' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Stats & Escalation Tier Tracker */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#111827',
              borderRadius: '16px',
              padding: '24px 32px',
              border: '1px solid #1f2937',
            }}
          >
            {/* Citizen Backers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  width: '56px',
                  height: '56px',
                  borderRadius: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                ▲
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
                  {raises}
                </span>
                <span style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                  Citizens Raised & Supported
                </span>
              </div>
            </div>

            {/* Current Tier */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '6px',
              }}
            >
              <span
                style={{
                  backgroundColor: '#1d4ed8',
                  color: '#eff6ff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                {tierName}
              </span>
              <span style={{ fontSize: '15px', color: '#64748b' }}>
                Status: {status.toUpperCase()} • Statutory SLA Clock Active
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #1e293b',
              paddingTop: '20px',
              fontSize: '16px',
              color: '#64748b',
            }}
          >
            <span>Official Community Grievance Dossier</span>
            <span>Independent • Neutral • Verified Outcomes • raise.org</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate card: ${e.message}`, { status: 500 });
  }
}
