import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

export const WallQR = ({ slug, businessName }) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const wallUrl = `${window.location.origin}/wall/${slug}`;

  const download = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-wall-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR downloaded");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(wallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass p-7 relative overflow-hidden" data-testid="wall-qr-card">
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[#FF2D75]/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF2D75] mb-3">
          <QrCode size={14} /> Your QR code
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Print &amp; share your Wall
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Drop this QR on receipts, menus, or signage. Customers scan → land on {businessName}'s public review wall.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div ref={ref} className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,45,117,0.25)] shrink-0" data-testid="wall-qr-image">
            <QRCodeCanvas
              value={wallUrl}
              size={148}
              fgColor="#0A0A0A"
              bgColor="#FFFFFF"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={wallUrl}
                className="input-dark text-xs flex-1"
                data-testid="wall-url-input"
              />
              <button
                onClick={copyLink}
                className="rounded-full p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition shrink-0"
                title="Copy URL"
                data-testid="copy-wall-url-btn"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={download} className="btn-primary text-xs" data-testid="download-qr-btn">
                <Download size={14} /> Download QR
              </button>
              <a
                href={wallUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs font-medium"
                data-testid="open-wall-link"
              >
                Open wall <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
