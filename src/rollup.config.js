import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import * as uglifyES from 'uglify-es'
import { uglify } from 'rollup-plugin-uglify'

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
      tsconfig: "./src/tsconfig.json",
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: false,
          inlineSourceMap: process.env.BUILD==='development'
        }
      }
    }),
    uglify({}, uglifyES.minify)
  ]
}