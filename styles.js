// styles.js
export const GlobalStyles = {
  colors: {
    // Brand palette (Gears)
    background: '#111316',   // app background (dark charcoal)
    surface:    '#16191D',   // cards / input backgrounds
    primary50:  '#F2E8CC',
    primary100: '#E9DDAE',
    primary200: '#DFCF8A',
    primary400: '#D3B964',
    primary500: '#C8A24E',   // Gold (primary)
    primary700: '#A88634',

    accent50:   '#F7EFD6',
    accent100:  '#EEDFAE',
    accent200:  '#E5CF86',
    accent400:  '#DCBF6C',
    accent500:  '#E0C879',   // Light gold

    gray500:    '#8E96A0',
    gray600:    '#6E7781',
    gray700:    '#3A3F45',

    onPrimary:  '#1B1B1B',
    onSurface:  '#EAE6DA',   // main text on dark surfaces
    border:     '#3A3F45',
    error500:   '#cc0000'
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
  },
  spacing: (n) => n * 8,
};

// Reusable component styles/tokens
export const Tokens = {
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.background,
    padding: GlobalStyles.spacing(2),
  },
  card: {
    backgroundColor: GlobalStyles.colors.surface,
    borderRadius: GlobalStyles.radius.lg,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    padding: GlobalStyles.spacing(2),
  },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: GlobalStyles.colors.onSurface,
    letterSpacing: 0.2,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: GlobalStyles.colors.onSurface,
  },
  body: {
    fontSize: 16,
    color: GlobalStyles.colors.onSurface,
  },
  caption: {
    fontSize: 13,
    color: GlobalStyles.colors.gray500,
  },

  inputContainer: {
    backgroundColor: GlobalStyles.colors.surface,
    borderRadius: GlobalStyles.radius.md,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    paddingHorizontal: GlobalStyles.spacing(1.5),
    paddingVertical: 10,
  },
  inputText: {
    color: GlobalStyles.colors.onSurface,
    fontSize: 16,
  },
  inputPlaceholder: GlobalStyles.colors.gray600,

  buttonPrimary: {
    container: {
      backgroundColor: GlobalStyles.colors.primary500,
      paddingVertical: 14,
      borderRadius: GlobalStyles.radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: GlobalStyles.colors.onPrimary,
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: 0.3,
    },
  },
  buttonPrimaryDisabled: {
    container: {
      backgroundColor: '#4A4F55',
      paddingVertical: 14,
      borderRadius: GlobalStyles.radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.65,
    },
    label: {
      color: '#C7CBD0',
      fontWeight: '700',
      fontSize: 16,
    },
  },
  buttonOutline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.25,
      borderColor: GlobalStyles.colors.border,
      paddingVertical: 14,
      borderRadius: GlobalStyles.radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: GlobalStyles.colors.onSurface,
      fontWeight: '700',
      fontSize: 16,
    },
  },
  link: {
    color: GlobalStyles.colors.accent500,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: GlobalStyles.colors.border,
  },
};
