/** @babel */
const Terminal = require('xterm')
require('xterm/dist/xterm.css')

export default class ScriptRunnerView {
    constructor(element, title) {
        this.element = element
        this.title = title
        this.setupTerminal()
    }

    destroy() {
        if (this.process) { this.process.destroy() }
        if (this.terminal) { this.terminal.destroy() }
    }

    update() {
    }

    getIconName() {
        return 'terminal'
    }

    getTitle() {
        return `Script Runner: ${this.title}`
    }

    setTitle(title) {
        this.title = title
    }

    setTheme(theme) {
        this.theme = theme
        return this.element.setAttribute('data-theme', theme)
    }

    setupTerminal() {
        this.terminal = new Terminal({
            rows: 15,
            cols: 80,
            cursorBlink: true
        })

        this.element.addEventListener('focus', () => this.terminal.focus())
        this.terminal.open(this.element, true)
    }

    outputResized() {
        return this.terminal.fit()
    }

    kill(signal) {
        if (this.process) { this.process.kill(signal) }
    }

    focus() {
        return this.terminal.focus()
    }

    clear() {
        return this.terminal.clear()
    }

    append(text, className) {
        return this.terminal.write(text)
    }

    log(text) {
        return this.terminal.write(text + '\r\n')
    }
}
