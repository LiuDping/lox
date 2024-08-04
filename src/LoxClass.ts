import type Interpreter from "./Interpreter";
import { LoxCallable, LoxFunction } from "./LoxCallable";
import LoxInstance from "./LoxInstance";

class LoxClass extends LoxCallable {
    readonly name: string;
    readonly superclass: LoxClass;
    readonly methods: Record<string, LoxFunction>;

    constructor(name: string, superclass: LoxClass, methods: Record<string, LoxFunction>) {
        super();
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }

    findMethod(name: string): LoxFunction | null {
        if (Object.hasOwn(this.methods, name)) {
            return this.methods[name];
        }

        if(this.superclass != null) {
            return this.superclass.findMethod(name);
        }

        return null;
    }

    call(interpreter: Interpreter, args: vObject[]): vObject {
        const instance: LoxInstance = new LoxInstance(this);

        const initializer: LoxFunction | null = this.findMethod('init');
        if (initializer != null) {
            initializer.bind(instance).call(interpreter, args);
        }

        return instance;
    }

    arity(): number {
        const initializer: LoxFunction | null = this.findMethod('init');
        if (initializer != null) return initializer.arity();
        return 0;
    }

    toString(): string {
        return this.name;
    }
}

export default LoxClass;