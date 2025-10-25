import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Quiz-LM-React/', // <-- IMPORTANT: Add this line and update the name!
})
