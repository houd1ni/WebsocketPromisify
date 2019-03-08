import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'

export default {
  input: 'src/WS.ts',
  output: {
    file: process.env.BUILD === 'cjs' ? 'dist/ws.js' : 'dist/ws.esm.js',
    format: process.env.BUILD === 'cjs' ? 'cjs' : 'es',
    name: 'wspromisify',
  },
  sourcemap: true,
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      typescript: require("typescript"),
      tsconfig: "./tsconfig.json",
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: false,
          inlineSourceMap: process.env.NODE_ENV==='development'
        }
      }
    }),
    terser(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.BUILD)
    })
  ]
}