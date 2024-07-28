import type { Binary, Grouping, Literal, Unary, Expr, Visitor } from "./Expr";

class AstPrinter implements Visitor<string> {

    print(expr: Expr): string {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize('group', expr.expression);
    }
    visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return 'nil';
        return expr.value.toString();
    }
    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    parenthesize(name: string, ...exprs: Expr[]) {
        let builder: string[] = [];

        builder.push('(')
        builder.push(name);
        for (let expr of exprs) {
            builder.push(' ');
            builder.push(expr.accept(this));
        }
        builder.push(')');

        return builder.join('');
    }
}


export default AstPrinter;