// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Theme colors
export const themeColors = {
  light: {
    background: '#ffffff',
    text: '#333333',
    primary: '#4CAF50',
    primaryHover: '#45a049',
    link: '#0bb8db',
    cardBackground: '#ffffff',
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    // Admin specific colors
    sidebarBackground: '#ffffff',
    sidebarText: '#333333',
    sidebarBorder: '#e0e0e0',
    sidebarHover: '#f5f5f5',
    sidebarActive: '#4CAF50',
    headerBackground: '#ffffff',
    headerText: '#333333',
    headerBorder: '#e0e0e0',
    headerShadow: 'rgba(0, 0, 0, 0.1)',
    headerIcon: '#666666',
    headerIconHover: '#333333',
    statCardBackground: '#ffffff',
    statCardText: '#333333',
    statCardBorder: '#e0e0e0',
    statCardHover: '#f5f5f5'
  },
  dark: {
    // Modern dark theme with better contrast and visual hierarchy
    background: '#1a1b1e', // Slightly lighter than pure black for better readability
    text: '#e1e1e1', // Soft white for better eye comfort
    primary: '#4CAF50',
    primaryHover: '#45a049',
    link: '#0bb8db',
    cardBackground: '#2c2d30', // Slightly lighter than background for depth
    border: '#3a3b3e', // Subtle border color
    shadow: 'rgba(0, 0, 0, 0.2)',
    // Admin specific colors
    sidebarBackground: '#2c2d30', // Matching card background
    sidebarText: '#e1e1e1',
    sidebarBorder: '#3a3b3e',
    sidebarHover: '#363739', // Subtle hover effect
    sidebarActive: '#4CAF50',
    headerBackground: '#2c2d30', // Matching sidebar
    headerText: '#e1e1e1',
    headerBorder: '#3a3b3e',
    headerShadow: 'rgba(0, 0, 0, 0.2)',
    headerIcon: '#a0a0a0', // Muted icon color
    headerIconHover: '#e1e1e1',
    statCardBackground: '#2c2d30',
    statCardText: '#e1e1e1',
    statCardBorder: '#3a3b3e',
    statCardHover: '#363739'
  }
};

// Theme management functions
export const getCurrentTheme = () => {
  return localStorage.getItem('theme') || THEMES.LIGHT;
};

export const setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  applyThemeColors(theme);
};

export const applyThemeColors = (theme) => {
  const colors = themeColors[theme];
  const root = document.documentElement;
  
  // Apply all theme colors as CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const cssVarName = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--${cssVarName}-color`, value);
  });
};

export const toggleTheme = (currentTheme) => {
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
  return newTheme;
}; 