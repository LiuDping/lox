import TokenType from "./TokenType";
import type Token from "./Token";
import type { Binary, Expr, Grouping, Literal, Unary, Visitor as ExprVisitor, Variable, Assign, Logical } from "./Expr";
import type { Block, Expression, If, Print, Stmt, Visitor as StmtVisitor, Var, While } from "./Stmt";
import RuntimeError from "./RuntimeError";
import Environment from "./Environment";
import Lox from "./Lox";

class Interpreter implements ExprVisitor<vObject>, StmtVisitor<void> {
    private environment: Environment = new Environment();

    interpret(statements: Stmt[]) {
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

    visitPrintStmt(stmt: Print): void {
        const value: vObject = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
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
        return this.environment.get(expr.name);
    }

    visitAssignExpr(expr: Assign): vObject {
        const value: vObject = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    private execute(stmt: Stmt): void {
        stmt.accept(this);
    }

    private executeBlock(statements: Stmt[], environment: Environment): void {
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