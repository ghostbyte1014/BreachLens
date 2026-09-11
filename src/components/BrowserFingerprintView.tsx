import React, { useState } from 'react';
import { BrowserFingerprintData } from '../types';
import { Fingerprint, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BrowserFingerprintView: React.FC = () => {
  const [data, setData] = useState<BrowserFingerprintData | null>(null);
  const [loading, setLoading] = useState(false);

  const runScan = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const ua = navigator.userAgent;
    const platform = navigator.platform || 'unknown';
    const language = navigator.language;
    const languages = [...navigator.languages];
    const screenRes = `${screen.width}x${screen.height} @ ${window.devicePixelRatio}x`;
    const colorDepth = screen.colorDepth;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookies = navigator.cookieEnabled;
    const dnt = navigator.doNotTrack;
    const cores = navigator.hardwareConcurrency || 0;
    const mem = (navigator as any).deviceMemory || null;
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // WebGL info
    let webglVendor = 'unavailable';
    let webglRenderer = 'unavailable';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          webglVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'unknown';
          webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown';
        }
      }
    } catch {}

    // Canvas fingerprint
    let canvasFingerprint = 'unavailable';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('BreachLens Fingerprint Test 🔍', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas entropy sample', 4, 30);
        const dataUrl = canvas.toDataURL();
        // Simple hash of the data URL
        let hash = 0;
        for (let i = 0; i < dataUrl.length; i++) {
          hash = ((hash << 5) - hash + dataUrl.charCodeAt(i)) | 0;
        }
        canvasFingerprint = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
      }
    } catch {}

    // WebRTC leak detection
    let webrtcLeaked = false;
    const webrtcLocalIPs: string[] = [];
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          const parts = e.candidate.candidate.split(' ');
          const ip = parts[4];
          if (ip && !ip.includes(':') && ip !== '0.0.0.0' && !webrtcLocalIPs.includes(ip)) {
            webrtcLocalIPs.push(ip);
            webrtcLeaked = true;
          }
        };
      });
      pc.close();
    } catch {}

    setData({
      userAgent: ua, platform, language, languages, screenResolution: screenRes,
      colorDepth, timezone: tz, cookiesEnabled: cookies, doNotTrack: dnt,
      hardwareConcurrency: cores, deviceMemory: mem, touchSupport: touch,
      webglVendor, webglRenderer, canvasFingerprint,
      webrtcLeaked, webrtcLocalIPs
    });
    setLoading(false);
  };

  const riskLevel = (field: string, value: any): 'safe' | 'warn' | 'danger' => {
    if (field === 'webrtcLeaked' && value) return 'danger';
    if (field === 'doNotTrack' && (value === null || value === 'unspecified')) return 'warn';
    if (field === 'cookiesEnabled' && value) return 'warn';
    return 'safe';
  };

  const RiskIcon: React.FC<{ risk: 'safe' | 'warn' | 'danger' }> = ({ risk }) => (
    risk === 'safe'
      ? <CheckCircle2 className="w-4 h-4 text-resolve shrink-0" />
      : <AlertTriangle className={`w-4 h-4 ${risk === 'danger' ? 'text-accent' : 'text-high'} shrink-0`} />
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Browser Fingerprint Check</h1>
        <p className="text-ink-soft max-w-2xl">
          Websites can identify and track you using your browser's unique characteristics — even without cookies. This scan shows exactly what your browser reveals about you.
        </p>
      </div>

      <button
        onClick={runScan}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
      >
        <Fingerprint className="w-4 h-4" />
        {loading ? 'Scanning...' : (data ? 'Scan Again' : 'Scan My Browser')}
      </button>

      {data && (
        <div className="space-y-4">
          {/* WebRTC Alert */}
          {data.webrtcLeaked && (
            <div className="bg-accent-tint/60 border border-accent/40 rounded-lg p-4 flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-accent-dark">WebRTC is leaking your local IP address</p>
                <p className="text-xs text-accent-dark/80 mt-0.5">
                  Your browser revealed: {data.webrtcLocalIPs.join(', ')}. Even with a VPN, WebRTC can expose your real IP. Consider disabling WebRTC in your browser settings.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line rounded-lg overflow-hidden shadow-xs">
            {[
              { label: 'User Agent', value: data.userAgent, field: 'userAgent' },
              { label: 'Platform', value: data.platform, field: 'platform' },
              { label: 'Language', value: `${data.language} (${data.languages.join(', ')})`, field: 'language' },
              { label: 'Screen Resolution', value: data.screenResolution, field: 'screen' },
              { label: 'Color Depth', value: `${data.colorDepth}-bit`, field: 'colorDepth' },
              { label: 'Timezone', value: data.timezone, field: 'timezone' },
              { label: 'Cookies Enabled', value: data.cookiesEnabled ? 'Yes' : 'No', field: 'cookiesEnabled' },
              { label: 'Do Not Track', value: data.doNotTrack || 'Not set', field: 'doNotTrack' },
              { label: 'CPU Cores', value: data.hardwareConcurrency.toString(), field: 'cores' },
              { label: 'Device Memory', value: data.deviceMemory ? `${data.deviceMemory} GB` : 'Hidden', field: 'mem' },
              { label: 'Touch Support', value: data.touchSupport ? 'Yes' : 'No', field: 'touch' },
              { label: 'WebGL Vendor', value: data.webglVendor, field: 'webgl' },
              { label: 'WebGL Renderer', value: data.webglRenderer, field: 'webgl2' },
              { label: 'Canvas Fingerprint', value: data.canvasFingerprint, field: 'canvas' },
              { label: 'WebRTC IP Leak', value: data.webrtcLeaked ? `Yes (${data.webrtcLocalIPs.join(', ')})` : 'No leak detected', field: 'webrtcLeaked' },
            ].map((row, i) => (
              <div key={i} className="bg-paper-card p-4 flex items-start gap-3">
                <RiskIcon risk={riskLevel(row.field, row.field === 'webrtcLeaked' ? data.webrtcLeaked : row.field === 'doNotTrack' ? data.doNotTrack : row.field === 'cookiesEnabled' ? data.cookiesEnabled : null)} />
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-ink-faint uppercase">{row.label}</div>
                  <div className="text-xs text-ink mt-0.5 break-all leading-relaxed">{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
