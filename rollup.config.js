import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: {
    file: 'build/index.js',
    format: 'cjs',
    exports: 'named',
  },
  external: [
    '@actions/core',
    '@actions/github',
    '@octokit/action',
    'debug',
    'fs/promises',
    'graphql-request',
    'graphql',
    'iso8601-duration',
    'path',
    'pretty-ms',
    'util',
  ],
  plugins: [typescript(), json()],
};
