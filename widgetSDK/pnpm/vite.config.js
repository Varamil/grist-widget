import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, '../widgetSDK.js'),
            name: 'WidgetSDK',
            fileName: 'widgetSDK',
        },
        outDir: '../min',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                format: 'cjs',
                assetFileNames: 'widgetSDK[extname]',
                entryFileNames: 'widgetSDK.[format].js'
            },
        },
    },
    output: { interop: 'auto', exports:"named" },
    server: { watch: { include: ['../min/*', '../*'] } }
});