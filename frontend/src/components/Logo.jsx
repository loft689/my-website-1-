const LOGO_URL = "https://customer-assets.emergentagent.com/job_e38da796-4e34-44aa-ac07-3e3afe6444bc/artifacts/9cvckxom_Screenshot%202026-04-30%20102910.png";

export const Logo = ({ size = 32, withText = true, className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`} data-testid="app-logo">
    <img
      src={LOGO_URL}
      alt="ReviewAI"
      width={size}
      height={size}
      className="drop-shadow-[0_0_12px_rgba(255,45,117,0.6)]"
      style={{ objectFit: "contain" }}
    />
    {withText && (
      <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Review<span className="gradient-text">AI</span>
      </span>
    )}
  </div>
);
