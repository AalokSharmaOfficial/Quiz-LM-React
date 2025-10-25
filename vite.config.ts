import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Quiz-LM-React/', // Replace 'react-quiz-lm' with your actual repository name
})