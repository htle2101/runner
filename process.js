/** @babel */

const PTY = require('node-pty')
const OS = require('os')
const Path = require('path')
const Shellwords = require('shellwords')
const TempWrite = require('temp-write')

export default class ScriptRunnerProcess {
    static run(view, cmd, env) {
        const scriptRunnerProcess = new ScriptRunnerProcess(view)

        scriptRunnerProcess.execute(cmd, env)

        return scriptRunnerProcess
    }

    static spawn(view, args, cwd, env) {
        const scriptRunnerProcess = new ScriptRunnerProcess(view)

        scriptRunnerProcess.spawn(args, cwd, env)

        return scriptRunnerProcess
    }

    constructor(view) {
        this.view = view
        this.pty = null
    }

    destroy() {
        if (this.pty) {
            this.pty.kill('SIGTERM')
            this.pty.destroy()
        }
    }

    kill(signal) {
        if (signal == null) { signal = 'SIGINT' }
        if (this.pty) {
            console.log('Sending', signal, 'to child', this.pty, 'pid', this.pty.pid)
            this.pty.kill(signal)
            if (this.view) {
                this.view.log(`<Sending ${signal}>`, 'stdin')
            }
        }
    }

    resolve(callback) {
        let cwd
        if (process.cwd()) {
            cwd = Path.dirname(process.cwd())
        }

        callback('ls', cwd)
        return true
    }

    execute(cmd, env) {
        // Split the incoming command so we can modify it
        const cwd = process.cwd()
        const args = Shellwords.split('bash')
        args.push(TempWrite.sync(cmd))
        return this.spawn(args, cwd, env)
    }

    spawn(args, cwd, env) {
        // Spawn the child process:
        console.log('spawn', args[0], args.slice(1), cwd, env)

        env['TERM'] = 'xterm-256color'

        this.pty = PTY.spawn(args[0], args.slice(1), {
            cols: this.view.terminal.cols,
            rows: this.view.terminal.rows,
            cwd: cwd,
            env: env,
            name: 'xterm-color'
        })

        this.startTime = new Date()

        // Update the status (*Shellwords.join doesn't exist yet):
        // this.view.log(args.join(' ') + ' (pgid ' + this.pty.pid + ')');

        if (this.view.process) {
            this.view.process.destroy()
        }

        this.view.process = this

        const { terminal } = this.view

        terminal.on('data', data => {
            console.log('view -> pty (data)', data.length)
            if (this.pty) {
                this.pty.write(data)
            }
        })

        terminal.on('resize', geometry => {
            if (this.pty) {
                console.log('view -> pty (resize)', geometry)
                this.pty.resize(geometry.cols, geometry.rows)
            }
        })

        this.pty.on('exit', () => {
            console.log('pty (exit)')
        })

        // Handle various events relating to the child process:
        this.pty.on('data', data => {
            console.log('pty -> view (data)', data.length)
            terminal.write(data)
        })

        this.pty.on('error', what => {
            console.log('pty (error)', what)
        })

        this.pty.on('exit', (code, signal) => {
            console.log('pty (exit)', code, signal)

            this.pty.destroy()
            this.pty = null

            this.endTime = new Date()
            if (this.view) {
                const duration = ` after ${(this.endTime - this.startTime) / 1000} seconds`
                if (signal) {
                    this.view.log(`Exited with signal ${signal}${duration}`)
                } else if (code && code != 0) {
                    this.view.log(`Exited with status ${code}${duration}`)
                }
            }
        })

        terminal.focus()
    }
};
