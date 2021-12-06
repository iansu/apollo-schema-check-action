import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    exports: 'named',
  },
  external: ['fs/promises', 'path', 'util'],
  plugins: [typescript(), json(), production && terser()],
};
