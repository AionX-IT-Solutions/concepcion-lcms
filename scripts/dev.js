'use strict'
// electron-vite dev launcher that strips ELECTRON_RUN_AS_NODE from the
// environment before spawning, so the Electron child process receives a
// clean env and `require('electron')` resolves to the built-in API.
const { spawn } = require('child_process')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn('npx', ['electron-vite', 'dev'], {
  env,
  stdio: 'inherit',
  shell: true
})

child.on('exit', (code) => process.exit(code ?? 0))
