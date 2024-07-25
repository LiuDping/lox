import { parseArgs } from "node:util";
import Lox from './src/Lox'

function main() {
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            lox: {
                type: 'string',
            },
        },
        strict: true,
        allowPositionals: true,
    });
    if (values.lox) {
        Lox.runFile(values.lox);
    } else {
        Lox.runPrompt();
    }
}

main()