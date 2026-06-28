import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('/src/components/ProductCompareView')) return 'compare'
          if (id.includes('/src/components/pwo/')) return 'pwo'
          if (id.includes('/src/components/protein/') || id.includes('ProteinPageViews')) return 'protein'
          if (id.includes('/src/components/creatine/') || id.includes('CreatinePageViews')) return 'creatine'
          if (id.includes('/src/data/pwoProducts')) return 'data-pwo'
          if (id.includes('/src/data/proteinProducts')) return 'data-protein'
          if (id.includes('/src/data/creatineProducts')) return 'data-creatine'
        },
      },
    },
  },
})
