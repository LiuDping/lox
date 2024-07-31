import RuntimeError from "./RuntimeError";
import type Token from "./Token";

class Environment {
    private readonly values: Record<string, vObject> = {}
    readonly enclosing: Environment | null;

    constructor();
    constructor(enclosing: Environment);
    constructor(enclosing?: Environment) {
        if (enclosing !== undefined) {
            this.enclosing = enclosing;
        } else {
            this.enclosing = null
        }
    }

    define(name: string, value: vObject): void {
        this.values[name] = value;
    }

    get(name: Token): vObject {
        if (Object.hasOwn(this.values, name.lexeme)) {
            return this.values[name.lexeme];
        }

        if (this.enclosing != null) return this.enclosing.get(name);

        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
    }

    assign(name: Token, value: vObject): void {
        if (Object.hasOwn(this.values, name.lexeme)) {
            this.values[name.lexeme] = value;
            return
        }

        if (this.enclosing != null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
    }
}

export default Environment;