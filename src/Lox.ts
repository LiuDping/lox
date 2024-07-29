import { exit } from 'node:process';
import TokenType from './TokenType';
import Token from './Token'
import Scanner from './Scanner'
import Parser from './Parser';
import type { Expr } from './Expr';
import AstPrinter from './AstPrinter';
import type RuntimeError from './RuntimeError';
import Interpreter from './Interpreter';

class Lox {
    static hadError: boolean = false;
    static hadRuntimeError: boolean = false;

    static readonly interpreter: Interpreter = new Interpreter()

    static async runFile(path: string): Promise<void> {
        const source: string = await Bun.file(path).text()
        Lox.run(source)

        // TODO: 理解含义
        if (Lox.hadError) exit(65)

        if (Lox.hadRuntimeError) exit(70);
    }

    static async runPrompt(): Promise<void> {
        console.write(`>> `);

        for await (const line of console) {
            if (line == '') break;
            Lox.run(line);

            Lox.hadError = false;

            console.write(`>> `);
        }
    }

    static run(source: string): void {
        const scanner = new Scanner(source)
        const tokens: Token[] = scanner.scanTokens();

        // for (const token of tokens) {
        //     console.log(token);
        // }

        const parser = new Parser(tokens);
        const expression: Expr = parser.parse()!;

        if (this.hadError) return;

        // console.log(new AstPrinter().print(expression))
        this.interpreter.interpret(expression);
    }

    static error(line: number, message: string): void;
    static error(token: Token, message: string): void;
    static error(lineOrTOken: number | Token, message: string): void {
        if (typeof lineOrTOken == 'number') {
            const line = lineOrTOken
            Lox.report(line, '', message);
        } else {
            const token = lineOrTOken
            if (token.type == TokenType.EOF) {
                this.report(token.line, ' at end', message);
            } else {
                this.report(token.line, " at '" + token.lexeme + "'", message);
            }
        }
    }

    static report(line: number, where: string, message: string) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        Lox.hadError = true;
    }

    static runtimeError(error: RuntimeError): void {
        console.error(error.message + '\n[line ' + error.token.line + ']');
        this.hadRuntimeError = true;
    }
}

export default Lox