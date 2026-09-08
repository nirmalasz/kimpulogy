import type { CSSProperties } from "react";

type LayerProps = {
  src: string;
  style: CSSProperties;
};

function Layer({ src, style }: LayerProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" aria-hidden src={src} className="absolute" style={style} />
  );
}

/** profile-interface/rafiki — Signup step 1/2 (545.72 × 422) */
export function SignupIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative aspect-[545.72/422] w-full ${className}`}
    >
      <Layer src="/illustrations/signup-bg-complete.svg" style={{ left: 0, top: "12.86%", width: "100%", height: "81.02%" }} />
      <Layer src="/illustrations/signup-bg-simple.svg" style={{ left: "13.76%", top: "9.57%", width: "69.86%", height: "61.91%" }} />
      <Layer src="/illustrations/signup-shadow.svg" style={{ left: "11.22%", top: "94.7%", width: "77.55%", height: "5.29%" }} />
      <Layer src="/illustrations/signup-character.svg" style={{ left: "19.68%", top: "25.77%", width: "32.46%", height: "71.53%" }} />
      <Layer src="/illustrations/signup-device.svg" style={{ left: 0, top: 0, width: "76.07%", height: "90.35%" }} />
    </div>
  );
}

/** authentication/amico — OTP step (370.85 × 363.39) */
export function OtpIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative aspect-[370.85/363.39] w-full ${className}`}
    >
      <Layer src="/illustrations/otp-floor.svg" style={{ left: 0, top: "39.45%", width: "100%", height: "60.55%" }} />
      <Layer src="/illustrations/otp-shadows.svg" style={{ left: "6.21%", top: "42.03%", width: "91.24%", height: "50.37%" }} />
      <Layer src="/illustrations/otp-clouds.svg" style={{ left: "6.82%", top: "5.26%", width: "24.35%", height: "9.71%" }} />
      <Layer src="/illustrations/otp-plants.svg" style={{ left: "0.42%", top: "51.96%", width: "12.57%", height: "20.84%" }} />
      <Layer src="/illustrations/otp-laptop.svg" style={{ left: "8.2%", top: 0, width: "80.58%", height: "90.02%" }} />
      <Layer src="/illustrations/otp-window.svg" style={{ left: "14.39%", top: "5.7%", width: "47.52%", height: "62.71%" }} />
      <Layer src="/illustrations/otp-numbers.svg" style={{ left: "18.26%", top: "31.42%", width: "47%", height: "36.71%" }} />
      <Layer src="/illustrations/otp-character.svg" style={{ left: "66.46%", top: "30.95%", width: "27.91%", height: "47.25%" }} />
      <Layer src="/illustrations/otp-bubble.svg" style={{ left: "83.62%", top: "15.07%", width: "10.3%", height: "16.37%" }} />
    </div>
  );
}

/** hello/rafiki — Signup success (592.63 × 441.58) */
export function HelloIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative aspect-[592.63/441.58] w-full ${className}`}
    >
      <Layer src="/illustrations/hello-bg-complete.svg" style={{ left: 0, top: 0, width: "100%", height: "93.16%" }} />
      <Layer src="/illustrations/hello-bg-simple.svg" style={{ left: "17.51%", top: "3.43%", width: "67.23%", height: "53.98%" }} />
      <Layer src="/illustrations/hello-shadow.svg" style={{ left: "11.22%", top: "93.92%", width: "77.55%", height: "6.08%" }} />
      <Layer src="/illustrations/hello-char2.svg" style={{ left: "59.13%", top: "10.75%", width: "20.93%", height: "85.87%" }} />
      <Layer src="/illustrations/hello-hello.svg" style={{ left: "30.5%", top: "30.66%", width: "42.08%", height: "38.22%" }} />
      <Layer src="/illustrations/hello-char1.svg" style={{ left: "17.64%", top: "17.58%", width: "23.58%", height: "79.06%" }} />
    </div>
  );
}

/** marketing-consulting/rafiki — Landing hero (539 × 401.62) */
export function LandingIllustration({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative aspect-[539/401.62] w-full ${className}`}
    >
      <Layer src="/illustrations/landing-bg-complete.svg" style={{ left: 0, top: 0, width: "100%", height: "93%" }} />
      <Layer src="/illustrations/landing-bg-simple.svg" style={{ left: "16.65%", top: "7.45%", width: "67.9%", height: "85.39%" }} />
      <Layer src="/illustrations/landing-shadow.svg" style={{ left: "11.22%", top: "93.92%", width: "77.55%", height: "6.08%" }} />
      <Layer src="/illustrations/landing-board.svg" style={{ left: "31.24%", top: "29.76%", width: "37.42%", height: "65.99%" }} />
      <Layer src="/illustrations/landing-bubble2.svg" style={{ left: "64.43%", top: "9.09%", width: "10.67%", height: "17.15%" }} />
      <Layer src="/illustrations/landing-char2.svg" style={{ left: "62.42%", top: "26.74%", width: "20.32%", height: "70.59%" }} />
      <Layer src="/illustrations/landing-bubble1.svg" style={{ left: "16.88%", top: "30.75%", width: "10.16%", height: "13.64%" }} />
      <Layer src="/illustrations/landing-char1.svg" style={{ left: "16.18%", top: "45.43%", width: "18.25%", height: "51.89%" }} />
    </div>
  );
}
