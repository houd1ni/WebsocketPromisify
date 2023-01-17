import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import tsc from 'typescript'

export default {
  input: 'src/WS.ts',
  output: {
    file: process.env.NODE_ENV=='development'
      ? 'dist/bundle.dev.js'
      : process.env.BUILD == 'cjs' ? 'dist/bundle.cjs' : 'dist/bundle.mjs',
    format: process.env.BUILD == 'cjs' ? 'cjs' : 'es',
    name: 'wspromisify'
  },
  treeshake: { moduleSideEffects: false },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      typescript: tsc,
      tsconfig: "./tsconfig.json",
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: false,
          inlineSourceMap: process.env.NODE_ENV=='development',
          module: 'esnext'
        }
      }
    }),
    process.env.NODE_ENV!='development' && terser(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  ]
}