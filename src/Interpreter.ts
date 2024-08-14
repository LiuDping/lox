import TokenType from "./TokenType";
import type Token from "./Token";
import type { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical, Call, LGet, LSet, This, Super } from "./Expr";
import type { Block, Class, Expression, Func, If, Print, Return, Stmt, Visitor as StmtVisitor, Var, While } from "./Stmt";
import { LoxFunction, LoxCallable } from "./LoxCallable";
import RuntimeError from "./RuntimeError";
import Environment from "./Environment";
import Lox from "./Lox";
import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";
import ReturnErr from './Return';

class Interpreter implements ExprVisitor<vObject>, StmtVisitor<void> {
    readonly globals: Environment = new Environment();
    private environment: Environment = this.globals;
    private readonly locals: Map<Expr, number> = new Map();

    interpret(statements: Stmt[]) {
        this.globals.define('clock', new (class extends LoxCallable {
            constructor() {
                super();
            }
            arity(): number {
                return 0;
            }
            call(interpreter: Interpreter, args: vObject[]): vObject {
                return new Date().valueOf() / 1000.0
            }
            toString(): string {
                return '<native fn>';
            }
        })());

        try {
            for (let statement of statements) {
                this.execute(statement);
            }
        } catch (error: any) {
            Lox.runtimeError(error);
        }
    }

    visitBlockStmt(stmt: Block): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitClassStmt(stmt: Class): void {
        let superclass: vObject = null;
        if (stmt.superclass != null) {
            superclass = this.evaluate(stmt.superclass);
            if (!(superclass instanceof LoxClass)) {
                throw new RuntimeError(stmt.superclass.name, "Superclass must be a class.");
            }
        }

        this.environment.define(stmt.name.lexeme, null);

        if (stmt.superclass != null) {
            this.environment = new Environment(this.environment);
            this.environment.define('super', superclass);
        }

        const methods: Record<string, LoxFunction> = {};
        for (let method of stmt.methods) {
            const func: LoxFunction = new LoxFunction(method, this.environment, method.name.lexeme == 'init');
            methods[method.name.lexeme] = func;
        }
        const klass = new LoxClass(stmt.name.lexeme, superclass as LoxClass, methods);

        if (superclass != null) {
            this.environment = this.environment.enclosing!;
        }

        this.environment.assign(stmt.name, klass);
    }

    visitIfStmt(stmt: If): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch != null) {
            this.execute(stmt.elseBranch)
        }
    }

    visitLogicalExpr(expr: Logical): vObject {
        const left = this.evaluate(expr.left);

        if (expr.operator.type == TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitWhileStmt(stmt: While): void {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }

    visitExpressionStmt(stmt: Expression): void {
        this.evaluate(stmt.expression);
    }

    visitFuncStmt(stmt: Func): void {
        const func: LoxFunction = new LoxFunction(stmt, this.environment, false);
        this.environment.define(stmt.name.lexeme, func);
    }

    visitPrintStmt(stmt: Print): void {
        const value: vObject = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }

    visitReturnStmt(stmt: Return): void {
        let value: vObject = null;
        if (stmt.value != null) value = this.evaluate(stmt.value);

        throw new ReturnErr(value);
    }

    visitVarStmt(stmt: Var): void {
        let value: vObject = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer)
        }

        this.environment.define(stmt.name.lexeme, value);
    }

    visitBinaryExpr(expr: Binary): vObject {
        const left: vObject = this.evaluate(expr.left);
        const right: vObject = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);
            case TokenType.PLUS:
                if (typeof left == 'number' && typeof right == 'number') {
                    return Number(left) + Number(right);
                }
                if (typeof left == 'string' && typeof right == 'string') {
                    return left.toString() + right.toString()
                }
                break;
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);

            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);

            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
        }

        return null;
    }

    visitCallExpr(expr: Call): vObject {
        const callee: vObject = this.evaluate(expr.callee);
        const args: vObject[] = [];

        for (let arg of expr.args) {
            args.push(this.evaluate(arg));
        }

        if (!(callee instanceof LoxCallable)) {
            throw new RuntimeError(expr.paren, "Can only call functions and classes.");
        }

        const func: LoxCallable = callee as unknown as LoxCallable;

        if (args.length != func.arity()) {
            throw new RuntimeError(expr.paren, "Expected " +
                func.arity() + " arguments but got " +
                args.length + ".");
        }

        return func.call(this, args);
    }

    visitLGetExpr(expr: LGet): vObject {
        const obj: vObject = this.evaluate(expr.obj);
        if (obj instanceof LoxInstance) {
            return (obj as LoxInstance).get(expr.name);
        }

        throw new RuntimeError(expr.name, "Only instances have properties.");
    }

    visitLSetExpr(expr: LSet): vObject {
        const obj: vObject = this.evaluate(expr.obj);

        if (!(obj instanceof LoxInstance)) {
            throw new RuntimeError(expr.name, "Only instances have fields.");
        }

        const value: vObject = this.evaluate(expr.value);
        (obj as LoxInstance).set(expr.name, value);
        return value;
    }

    visitThisExpr(expr: This): vObject {
        return this.lookUpVariable(expr.keyword, expr);
    }

    visitSuperExpr(expr: Super): vObject {
        const distance: number = this.locals.get(expr)!;
        const superclass: LoxClass = this.environment.getAt(distance, 'super') as LoxClass;
        const obj: LoxInstance = this.environment.getAt(distance - 1, 'this') as LoxInstance;
        const method: LoxFunction | null = superclass.findMethod(expr.method.lexeme);
        if (method == null) {
            throw new RuntimeError(expr.method, "Undefined property '" + expr.method.lexeme + "'.");
        }
        return method.bind(obj);
    }

    visitGroupingExpr(expr: Grouping): vObject {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: Literal): vObject {
        return expr.value;
    }

    visitUnaryExpr(expr: Unary): vObject {
        const right: vObject = this.evaluate(expr.right);
        this.checkNumberOperand(expr.operator, right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                return -Number(right);
            case TokenType.BANG:
                return !this.isTruthy(right);
        }

        return null;
    }

    visitVariableExpr(expr: Variable): vObject {
        // return this.environment.get(expr.name);
        return this.lookUpVariable(expr.name, expr);
    }

    private lookUpVariable(name: Token, expr: Expr): vObject {
        const distance: number | undefined = this.locals.get(expr);
        if (typeof distance == 'number') {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.globals.get(name);
        }
    }

    visitAssignExpr(expr: Assign): vObject {
        const value: vObject = this.evaluate(expr.value);
        // this.environment.assign(expr.name, value);

        const distance: number | undefined = this.locals.get(expr);
        if (typeof distance == 'number') {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }

        return value;
    }

    private execute(stmt: Stmt): void {
        stmt.accept(this);
    }

    resolve(expr: Expr, depth: number): void {
        this.locals.set(expr, depth);
    }

    executeBlock(statements: Stmt[], environment: Environment): void {
        const previous: Environment = this.environment;
        try {
            this.environment = environment;

            for (let statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    private evaluate(expr: Expr): vObject {
        return expr.accept(this);
    }

    private checkNumberOperand(operator: Token, operand: vObject): void {
        if (typeof operand == 'number') return;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    private checkNumberOperands(operator: Token, left: vObject, right: vObject): void {
        if (typeof left == 'number' && typeof right == 'number') return;

        throw new RuntimeError(operator, "Operands must be numbers.");
    }

    private isTruthy(object: vObject): boolean {
        if (object == null) return false;
        if (typeof object == 'boolean') return object;
        return true;
    }

    private isEqual(a: vObject, b: vObject): boolean {
        if (a == null && b == null) return true;
        if (a == null) return false;

        return a === b;
    }

    private stringify(object: vObject): string {
        if (object == null) return "nil";

        if (typeof object == 'number') {
            let text: string = object.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }

        return object.toString();
    }
}

export default Interpreter