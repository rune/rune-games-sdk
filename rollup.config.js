// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

export default [{
  input: 'src/browser.ts',
  output: {
    file: 'dist/browser.js',
    format: 'iife',
    name: 'Rune'
  },
  plugins: [
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: {
        'globalThis': 'window',
      },
    }),
    typescript({tsconfig: './tsconfig.browser.json'}),
  ]
}, {
  input: 'src/index.ts',
  output: {
    sourcemap: true,
    format: 'commonjs',
    file: 'dist/index.js',
  },
  plugins: [typescript({tsconfig: './tsconfig.json'})]
}]