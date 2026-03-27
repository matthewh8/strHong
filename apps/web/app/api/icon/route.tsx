import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(512, Math.max(16, parseInt(searchParams.get('size') ?? '192', 10)));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.22,
        }}
      >
        {/* Outer glow circle */}
        <div
          style={{
            width: size * 0.68,
            height: size * 0.68,
            background: 'rgba(0,150,255,0.12)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Blue drop shape — two concentric circles */}
          <div
            style={{
              width: size * 0.46,
              height: size * 0.46,
              background: '#0096FF',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                color: '#0f172a',
                fontSize: size * 0.26,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                fontFamily: 'sans-serif',
              }}
            >
              W
            </div>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
