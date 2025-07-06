import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { normalizePath } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, '../widget.min.js'),
            name: 'widget',
            fileName: 'widget',
        },
        outDir: '../min',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                format: 'cjs',
                assetFileNames: 'widget[extname]',
                entryFileNames: 'widget.js'
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
        viteStaticCopy({
            targets: [
                {
                    src: normalizePath(resolve(__dirname, '../i18n')),
                    dest: './',
                },
            ],
        }),
    ],
});