import TokenType from "./TokenType";
import type Token from "./Token";
import type { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./Expr";
import Lox from "./Lox";
import RuntimeError from "./RuntimeError";

class Interpreter implements Visitor<vObject> {
    interpret(expression: Expr) {
        try {
            const value: vObject = this.evaluate(expression);
            console.log(this.stringify(value));
        } catch (error: any) {
            Lox.runtimeError(error);
        }
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