import { type FastifyInstance } from 'fastify';

const faviconSvg = String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="faviconTitle faviconDesc">
  <title id="faviconTitle">Painel de Chegadas favicon</title>
  <desc id="faviconDesc">Ticket-inspired red badge with an arrival board monogram.</desc>
  <defs>
    <linearGradient id="paperGlow" x1="10%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#fff1ed"/>
    </linearGradient>
    <linearGradient id="accentWash" x1="18%" y1="12%" x2="84%" y2="90%">
      <stop offset="0%" stop-color="#fe3a4d"/>
      <stop offset="100%" stop-color="#ce2137"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#111322" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="64" height="64" rx="18" fill="url(#paperGlow)"/>
  <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#accentWash)" filter="url(#shadow)"/>
  <path d="M6 18c4.2 0 4.2-6 8.4-6h35.2c4.2 0 4.2 6 8.4 6v4c-4.2 0-4.2 6-8.4 6H14.4C10.2 28 10.2 22 6 22z" fill="#ffb3ac" fill-opacity="0.28"/>
  <path d="M17 18.5h14.2c7.8 0 12.5 3.8 12.5 11.2 0 7.2-4.8 11-12.2 11h-4.3V48H17zm10.2 8v6h4.1c2.8 0 4.4-.9 4.4-3 0-2.1-1.6-3-4.4-3z" fill="#fff8f2"/>
  <rect x="40.5" y="21" width="7.5" height="22" rx="3.75" fill="#171a24"/>
  <path d="M44.25 21v22" stroke="#fff8f2" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.8 4"/>
  <circle cx="46.8" cy="18.2" r="2.8" fill="#171a24"/>
  <path d="M46.8 15.2v7.4m-3.1-3.7h6.2" stroke="#fff8f2" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export function registerFaviconRoute(app: FastifyInstance): void {
  app.get('/favicon.svg', async (_request, reply) => {
    reply.type('image/svg+xml').send(faviconSvg);
  });
}
