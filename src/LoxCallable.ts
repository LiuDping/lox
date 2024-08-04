import Environment from "./Environment";
import type Interpreter from "./Interpreter"
import type LoxInstance from "./LoxInstance";
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
    private readonly isInitializer: boolean;

    constructor(declaration: Func, closure: Environment, isInitializer: boolean) {
        super();
        this.closure = closure;
        this.declaration = declaration;
        this.isInitializer = isInitializer;
    }

    bind(instance: LoxInstance): LoxFunction {
        const environment: Environment = new Environment(this.closure);
        environment.define('this', instance);
        return new LoxFunction(this.declaration, environment, this.isInitializer);
    }

    call(interpreter: Interpreter, args: vObject[]): vObject {
        const environment: Environment = new Environment(this.closure);
        
        for (let i = 0, len = this.declaration.params.length; i < len; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (e) {
            if (this.isInitializer) {
                interpreter._lox_return_.pop();
                return this.closure.getAt(0, 'this');
            }
            // @ts-nocheck
            // @ts-ignore
            if (e.message == '_lox_return_') return interpreter._lox_return_.pop()!;
        }

        if (this.isInitializer) return this.closure.getAt(0, 'this');

        return null;
    }

    arity(): number {
        return this.declaration.params.length;
    }

    toString(): string {
        return '<fn ' + this.declaration.name.lexeme + '>';
    }
}