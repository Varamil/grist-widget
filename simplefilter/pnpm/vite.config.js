import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { normalizePath } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, '../script.min.js'),
            name: 'script',
            fileName: 'script',
        },
        outDir: '../min',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                format: 'cjs',
                assetFileNames: 'script[extname]',
                entryFileNames: 'script.js'
            },
        },
    },
    output: { interop: 'auto' },
    server: { watch: { include: ['../min/*', '../*'] } },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: normalizePath(resolve(__dirname, '../index.html')),
                    dest: './',
                },
            ],
        }),
    ],
});