/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import json from "@rollup/plugin-json";
import typescript from 'rollup-plugin-typescript2';
// import babel from '@rollup/plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
export default [
    {
        input: './src/index.ts',
        output: [{
            format: 'cjs',
            file: './dist/index.js',
            banner: require('./scripts/copyright')
        }],
        plugins: [
            // babel({
            //     babelHelpers: "runtime",
            //     configFile: './babel.config.js',
            //     exclude: 'node_modules/**',
            // }),
            json(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: false,
                        declarationMap: false,
                        module: "ESNext"
                    }
                }
            }),
            // babel(),
            // uglify()
        ]
    },
    {
        input: './src/index.ts',
        output: [{
            format: 'es',
            file: './dist/index.mjs',
            banner: require('./scripts/copyright')
        }],
        plugins: [
            // babel({
            //     babelHelpers: "runtime",
            //     configFile: './babel.config.js',
            //     exclude: 'node_modules/**',
            // }),
            json(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: false,
                        declarationMap: false,
                        module: "ESNext"
                    }
                }
            }),
            // babel(),
            uglify()
        ]
    }
]