import type { LoxFunction } from "./LoxCallable";
import type LoxClass from "./LoxClass";
import RuntimeError from "./RuntimeError";
import type Token from "./Token";

class LoxInstance {
    private readonly klass: LoxClass;
    private readonly fields: Record<string, vObject> = {};

    constructor(klass: LoxClass) {
        this.klass = klass;
    }

    get(name: Token): vObject {
        if (Object.hasOwn(this.fields, name.lexeme)) {
            return this.fields[name.lexeme];
        }

        const method: LoxFunction | null = this.klass.findMethod(name.lexeme);
        if (method != null) return method.bind(this);

        throw new RuntimeError(name, "Undefined property '" + name.lexeme + "'.");
    }

    set(name: Token, value: vObject): void {
        this.fields[name.lexeme] = value;
    }

    toString(): string {
        return this.klass.name + ' instance';
    }
}

export default LoxInstance;