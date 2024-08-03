import type { Assign, Binary, Call, Expr, Visitor as ExprVisitor, Grouping, Literal, Logical, Unary, Variable, } from "./Expr";
import type { Stmt, Var, Block, Visitor as StmtVisitor, Func, Expression, If, Print, Return, While, } from "./Stmt";
import Interpreter from "./Interpreter";
import type Token from "./Token";
import Lox from "./Lox";

enum FunctionType {
    NONE,
    FUNCTION
}

class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private readonly interpreter: Interpreter;
    private readonly scopes: Array<Record<string, boolean>> = [];
    private currentFunction = FunctionType.NONE;

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    visitBlockStmt(stmt: Block): void {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }

    visitExpressionStmt(stmt: Expression): void {
        this.resolve(stmt.expression);
    }

    visitFuncStmt(stmt: Func): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, FunctionType.FUNCTION);
    }

    visitIfStmt(stmt: If): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        if (stmt.elseBranch != null) this.resolve(stmt.elseBranch);
    }

    visitPrintStmt(stmt: Print): void {
        this.resolve(stmt.expression);
    }

    visitReturnStmt(stmt: Return): void {
        if (this.currentFunction == FunctionType.NONE) {
            Lox.error(stmt.keyword, "Can't return from top-level code.");
        }

        if (stmt.value != null) {
            this.resolve(stmt.value);
        }
    }

    visitVarStmt(stmt: Var): void {
        this.declare(stmt.name);
        if (stmt.initializer != null) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitWhileStmt(stmt: While): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }

    visitAssignExpr(expr: Assign): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    visitBinaryExpr(expr: Binary): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitCallExpr(expr: Call): void {
        this.resolve(expr.callee);
        for (let arg of expr.args) {
            this.resolve(arg);
        }
    }

    visitGroupingExpr(expr: Grouping): void {
        this.resolve(expr.expression);
    }

    visitLiteralExpr(expr: Literal): void {

    }

    visitLogicalExpr(expr: Logical): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitUnaryExpr(expr: Unary): void {
        this.resolve(expr.right);
    }

    visitVariableExpr(expr: Variable): void {
        if (!this.scopes.length && !this.scopes.at(-1)![expr.name.lexeme]) {
            Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    resolve(statements: Stmt[]): void;
    resolve(stmt: Stmt): void;
    resolve(stmt: Expr): void;
    resolve(s: Stmt[] | Stmt | Expr): void {
        if (Array.isArray(s)) {
            for (let statement of s) {
                this.resolve(statement)
            }
        } else {
            s.accept(this);
        }
    }

    resolveFunction(func: Func, type: FunctionType): void {
        const enclosingFunction: FunctionType = this.currentFunction;
        this.currentFunction = type;

        this.beginScope();
        for (let param of func.params) {
            this.declare(param);
            this.define(param);
        }

        this.resolve(func.body);
        this.endScope();

        this.currentFunction = enclosingFunction;
    }

    private beginScope(): void {
        this.scopes.push({});
    }

    private endScope(): void {
        this.scopes.pop();
    }

    private declare(name: Token): void {
        if (!this.scopes.length) return;

        const scope: Record<string, boolean> = this.scopes.at(-1)!;

        if (scope[name.lexeme] !== undefined) {
            Lox.error(name, "Already a variable with this name in this scope.");
        }

        scope[name.lexeme] = false;
    }

    private define(name: Token): void {
        if (!this.scopes.length) return;
        this.scopes.at(-1)![name.lexeme] = true;
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (Object.hasOwn(this.scopes[i], name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
            }
        }
    }
}

export default Resolver;