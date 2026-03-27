import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'strHong',
    short_name: 'strHong',
    description: 'Track your daily water intake.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      { src: '/api/icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/api/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Log Water',
        short_name: 'Log Water',
        description: 'Quick-log your water intake',
        url: '/widget',
        icons: [{ src: '/api/icon?size=192', sizes: '192x192' }],
      },
    ],
  };
}
