// Curated palettes for charts (light/dark friendly)
export const palettes = {
  indigo: {
    primary: '#6366F1',
    secondary: '#A5B4FC',
    gradientFrom: '#6366F1',
    gradientTo: '#22D3EE'
  },
  emerald: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    gradientFrom: '#10B981',
    gradientTo: '#34D399'
  },
  amber: {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    gradientFrom: '#F59E0B',
    gradientTo: '#F97316'
  },
  rose: {
    primary: '#F43F5E',
    secondary: '#FDA4AF',
    gradientFrom: '#F43F5E',
    gradientTo: '#FB7185'
  },
  sky: {
    primary: '#0EA5E9',
    secondary: '#7DD3FC',
    gradientFrom: '#0EA5E9',
    gradientTo: '#22D3EE'
  },
}

export function categoricalColors(n, base = 'indigo') {
  const baseHue = palettes[base]?.primary || palettes.indigo.primary
  const fallbacks = [
    '#6366F1', '#22D3EE', '#10B981', '#F59E0B', '#F43F5E', '#A855F7', '#84CC16', '#06B6D4', '#FB7185', '#8B5CF6'
  ]
  const out = []
  for (let i = 0; i < n; i++) {
    out.push(fallbacks[i % fallbacks.length])
  }
  return out
}


