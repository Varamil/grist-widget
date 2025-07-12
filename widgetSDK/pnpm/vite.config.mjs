import { resolve } from 'path';
//import { defineConfig } from 'vite';
import { build } from "vite";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const libraries = [
    {
        entry: resolve(__dirname, '../widgetSDK.js'),
        name: 'WidgetSDK',
        fileName: 'widgetSDK',
    },
    {
        entry: resolve(__dirname, '../RecFilter.js'),
        name: 'RecFilter',
        fileName: 'RecFilter',
    },
  ];

  libraries.forEach(async (lib) => {
    await build({
        configFile: false,
        build: {
            lib: {
                ...lib,
                format: 'cjs',
            },
            outDir: resolve(__dirname, '../min'),
            emptyOutDir: false,            
        },
        output: { interop: 'auto', exports:"named" },
        server: { watch: { include: ['../min/*', '../*'] } },
    });
  });


// export default defineConfig({
//     build: {
//         lib: {
//             entry: resolve(__dirname, '../widgetSDK.js'),
//             name: 'WidgetSDK',
//             fileName: 'widgetSDK',
//         },
//         outDir: '../min',
//         emptyOutDir: true,
//         rollupOptions: {
//             output: {
//                 format: 'cjs',
//                 assetFileNames: 'widgetSDK[extname]',
//                 entryFileNames: 'widgetSDK.[format].js'
//             },
//         },
//     },
//     output: { interop: 'auto', exports:"named" },
//     server: { watch: { include: ['../min/*', '../*'] } }
// });