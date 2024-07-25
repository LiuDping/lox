import { exit } from 'node:process';
import Scanner from './Scanner'
import Token from './Token'

class Lox {
    static hadError: boolean = false;

    static async runFile(path: string): Promise<void> {
        const source: string = await Bun.file(path).text()
        Lox.run(source)

        // TODO: 理解含义
        if (Lox.hadError) exit(65)
    }

    static async runPrompt(): Promise<void> {
        console.write(`>\n `);

        for await (const line of console) {
            if (line == '') break;
            Lox.run(line);

            Lox.hadError = false;
        }
    }

    static run(source: string): void {
        const scanner = new Scanner(source)
        const tokens: Token[] = scanner.scanTokens();

        for (const token of tokens) {
            console.log(token);
        }
    }

    static error(line: number, message: string): void {
        Lox.report(line, '', message);
    }

    static report(line: number, where: string, message: string) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        Lox.hadError = true;
    }
}

export default Lox