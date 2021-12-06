import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    exports: 'named',
  },
  external: ['fs/promises', 'path', 'util', 'vm2'],
  plugins: [typescript(), json(), commonjs(), nodeResolve(), production && terser()],
};
