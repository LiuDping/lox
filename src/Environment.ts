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

    ancestor(distance: number): Environment {
        let environment: Environment = this;
        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing!;
        }
        return environment!;
    }

    getAt(distance: number, name: string): vObject {
        return this.ancestor(distance).values[name];
    }

    get(name: Token): vObject {
        if (Object.hasOwn(this.values, name.lexeme)) {
            return this.values[name.lexeme];
        }

        if (this.enclosing != null) return this.enclosing.get(name);

        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
    }

    assignAt(distance: number, name: Token, value: vObject): void {
        this.ancestor(distance).values[name.lexeme] = value;
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