export const tokens = {
  color: {
    primary: {
      100: "#D7ECFF",
      200: "#9FC6E8",
      300: "#3D568F",
      400: "#354973",
      500: "#242E47",
    },
    secondary: {
      100: "#FFF1D5",
      200: "#FBDCA8",
      300: "#FDC674",
      400: "#FBA33C",
      500: "#F08B12",
      600: "#EA6C0C",
    },
    tertiary: {
      100: "#EDF0FF",
      200: "#D9E2FF",
      500: "#7F90BB",
      600: "#A1BD25",
    },
    neutral: {
      100: "#FAFAFF",
      200: "#EEF0F2",
      300: "#ECEBE4",
      400: "#C7C9CF",
      500: "#8A8F98",
    },
    semantic: {
      success: { solid: "#22A06B", text: "#1F6B4E", bg: "#E7F5EF" },
      warning: { solid: "#F5A623", text: "#9A6B00", bg: "#FEF6E7" },
      alert: { solid: "#D94A4A", text: "#A43A3A", bg: "#FBEDED" },
      info: { solid: "#4A7BD9", text: "#34539E", bg: "#EDF2FC" },
    },
    bg: {
      default: "#FFFFFF",
      subtle: "#F6F7F9",
    },
    fg: {
      default: "#242E47",
      text: "#354973",
      "text-contrast": "#FFFFFF",
      line: "#E4E6EA",
    },
  },
  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    full: 999,
  },
  fontFamily: {
    heading: "Plus Jakarta Sans",
    body: "Inter",
  },
  fontSize: {
    h1: 48,
    h2: 40,
    h3: 32,
    h4: 28,
    title1: 19,
    title2: 17,
    body: 16,
    caption: 14,
    small: 12,
  },
} as const;

export type Tokens = typeof tokens;