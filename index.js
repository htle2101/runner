/** @babel */

import ScriptRunnerProcess from './process'

const ChildProcess = require('child_process');
const ShellEnvironment = require('shell-environment');

const Path = require('path');
const Shellwords = require('shellwords');

export default class ScriptRunner {

    constructor() {
        this.commandMap = [
            { scope: '^source\\.coffee', command: 'coffee' },
            { scope: '^source\\.js', command: 'node' },
            { scope: '^source\\.ruby', command: 'ruby' },
            { scope: '^source\\.python', command: 'python' },
            { scope: '^source\\.go', command: 'go run' },
            { scope: '^text\\.html\\.php', command: 'php' },
            { scope: 'Shell Script (Bash)', command: 'bash' },
            { path: 'spec\\.coffee$', command: 'jasmine-node --coffee' },
            { path: '\\.sh$', command: 'bash' }
        ]
    }

    runShell(view) {
        const path = Path.dirname(process.cwd());
        view.setTitle('Shell');
        ShellEnvironment.loginEnvironment((error, environment) => {
            if (environment) {
                const cmd = environment['SHELL'];
                const args = Shellwords.split(cmd).concat("-l");

                ScriptRunnerProcess.spawn(view, args, path, environment);
            } else {
                throw new Error(error);
            }
        });
    }

    run(view, cmd) {
        const path = process.cwd();

        if (cmd == null) {
            alert(`Not sure how to run '${path}' :/`);
            return false;
        }

        view.setTitle(path);
        ShellEnvironment.loginEnvironment((error, environment) => {
            if (environment) {
                ScriptRunnerProcess.run(view, cmd, environment);
            } else {
                throw new Error(error);
            }
        });
    }

    commandFor() {
        const path = process.cwd()
        const scope = 'Shell Script (Bash)'
        // Lookup using the command map:
        for (let method of Array.from(this.commandMap)) {
            if (method.fileName && (path != null)) {
                if (path.match(method.path)) {
                    return method.command;
                }
            } else if (method.scope) {
                if (scope.match(method.scope)) {
                    return method.command;
                }
            }
        }
    }
}
