import Environment from "./Environment";
import type Interpreter from "./Interpreter"
import type { Func } from "./Stmt";

export class LoxCallable {
    call(interpreter: Interpreter, args: vObject[]): vObject {
        return null;
    }
    arity(): number {
        return 0;
    }
    toString(): string {
        return '<fn>'
    }
}

export class LoxFunction extends LoxCallable {
    private readonly declaration: Func;
    private readonly closure: Environment;
    constructor(declaration: Func, closure: Environment) {
        super();
        this.closure = closure;
        this.declaration = declaration;
    }
    call(interpreter: Interpreter, args: vObject[]): vObject {
        const environment: Environment = new Environment(this.closure);

        for (let i = 0, len = this.declaration.params.length; i < len; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (e) {
            // @ts-nocheck
            // @ts-ignore
            if (e.message == '_lox_return_') return interpreter._lox_return_.pop()!;
        }

        return null;
    }
    arity(): number {
        return this.declaration.params.length;
    }
    toString(): string {
        return '<fn ' + this.declaration.name.lexeme + '>';
    }
}