import { parseArgs } from "node:util";
import Lox from './src/Lox'

function main() {
    const { positionals } = parseArgs({
        args: Bun.argv,
        options: {},
        strict: true,
        allowPositionals: true,
    });
    if (positionals.length > 2) {
        for (let file of positionals.slice(2)) {
            Lox.runFile(file)
        }
    } else {
        Lox.runPrompt();
    }
}

main()