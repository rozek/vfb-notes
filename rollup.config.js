// see https://github.com/rozek/build-configuration-study

import svelte         from 'rollup-plugin-svelte'
import commonjs       from '@rollup/plugin-commonjs'
import resolve        from '@rollup/plugin-node-resolve'
import autoPreprocess from 'svelte-preprocess'
import typescript     from '@rollup/plugin-typescript'
import postcss        from 'rollup-plugin-postcss'
import saveToFile     from 'save-to-file'
import livereload     from 'rollup-plugin-livereload'
import { terser }     from 'rollup-plugin-terser'
import css            from "rollup-plugin-css-only"

const production = !process.env.ROLLUP_WATCH;

function serve () {
  let Server
  
  function killServer() {
    if (Server != null) { Server(0) }
  }

  return { writeBundle () {
    if (Server == null) {
      Server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      })

      process.on('SIGTERM', killServer)
      process.on('exit',    killServer)
    }
  } }
}

export default {
  input: './src/index.ts',
  output: {
    sourcemap:true,
    format:   'iife',
    name:     'app',
    file:     './build/index.js'
  },
  plugins: [
    svelte({ preprocess:[
      autoPreprocess({ aliases:[['ts','typescript']] }),
    ]}),

    css({ output:"index.css" }),

    resolve({ browser:true, dedupe:['svelte'] }), commonjs(), typescript(),

    ! production && serve(),
    ! production && livereload('./build'),

    production && terser()
  ],
  watch: { clearScreen:false }
};
