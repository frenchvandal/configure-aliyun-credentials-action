import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const plugins = [typescript(), nodeResolve({ preferBuiltins: true }), commonjs(), json()]

const sharedOutput = {
  esModule: true,
  format: 'es',
  sourcemap: true
}

export default [
  {
    input: 'src/main.ts',
    output: { ...sharedOutput, file: 'dist/main/index.js' },
    plugins
  },
  {
    input: 'src/cleanup.ts',
    output: { ...sharedOutput, file: 'dist/cleanup/index.js' },
    plugins
  }
]