import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Civic Grievance';
    const ward = searchParams.get('ward') || 'Pimpri-Chinchwad';
    const category = searchParams.get('category') || 'civic';
    const raises = searchParams.get('raises') || '1';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '28px',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  letterSpacing: '2px',
                }}
              >
                RAISE
              </div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                RAISE • National Citizen Grievance Dossier
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                fontSize: '18px',
                fontWeight: 700,
                padding: '8px 18px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                border: '1px solid #334155',
              }}
            >
              {category}
            </div>
          </div>

          {/* Middle Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                maxHeight: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#94a3b8',
                fontSize: '24px',
              }}
            >
              <span>📍 {ward}</span>
              <span>•</span>
              <span>Pimpri-Chinchwad / Pune</span>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px solid #334155',
              paddingTop: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#1e293b',
                padding: '12px 24px',
                borderRadius: '16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '28px' }}>✊</div>
              <div style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700 }}>
                {raises} Citizens Supported
              </div>
            </div>

            <div
              style={{
                color: '#64748b',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              Statutory Civic Platform • raise.org
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
