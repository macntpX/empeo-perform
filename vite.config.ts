import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { hrmDatabasePlugin } from './vite-plugin-hrm-db';

export default defineConfig({
  plugins: [react(), hrmDatabasePlugin()],
});
