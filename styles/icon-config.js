// This is a configuration for generating app icons
// You can use this with expo to generate icons, or create them manually

const iconConfig = {
  // App Icon - A shield with a network/scanning theme
  backgroundColor: '#0a0e21',
  foregroundColor: '#3b82f6',
  
  // Icon Design Elements:
  // 1. Shield shape as the main icon
  // 2. A scanning radar wave inside the shield
  // 3. A checkmark to symbolize security
  // 4. Network nodes around the shield
  
  sizes: {
    icon: 1024,
    adaptiveIcon: {
      foreground: 432,
      background: '#0a0e21'
    },
    splash: {
      width: 1284,
      height: 2778
    }
  }
};

module.exports = iconConfig;
