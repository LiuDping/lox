import Token from "./Token";

abstract class Expr {
    abstract accept<R>(visitor: Visitor<R>): R;
}

interface Visitor<R> {
    visitBinaryExpr(expr: Binary): R;
    visitCallExpr(expr: Call): R;
    visitLGetExpr(expr: LGet): R;
    visitLSetExpr(expr: LSet): R;
    visitThisExpr(expr: This): R;
    visitSuperExpr(expr: Super): R;
    visitGroupingExpr(expr: Grouping): R;
    visitLiteralExpr(expr: Literal): R;
    visitUnaryExpr(expr: Unary): R;
    visitVariableExpr(expr: Variable): R;
    visitAssignExpr(expr: Assign): R
    visitLogicalExpr(expr: Logical): R;
}

export class Binary extends Expr {
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr) {
        super()
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

export class Call extends Expr {
    readonly callee: Expr;
    readonly paren: Token;
    readonly args: Expr[];

    constructor(callee: Expr, paren: Token, args: Expr[]) {
        super();
        this.callee = callee;
        this.paren = paren;
        this.args = args;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}

export class LGet extends Expr {
    readonly obj: Expr;
    readonly name: Token;

    constructor(obj: Expr, name: Token) {
        super()
        this.obj = obj;
        this.name = name;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLGetExpr(this);
    }
}

export class LSet extends Expr {
    readonly obj: Expr;
    readonly name: Token;
    readonly value: Expr;

    constructor(obj: Expr, name: Token, value: Expr) {
        super()
        this.obj = obj;
        this.name = name;
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLSetExpr(this);
    }
}

export class This extends Expr {
    readonly keyword: Token;

    constructor(keyword: Token) {
        super()
        this.keyword = keyword;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}

export class Super extends Expr {
    readonly keyword: Token;
    readonly method: Token;

    constructor(keyword: Token, method: Token) {
        super()
        this.keyword = keyword;
        this.method = method;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitSuperExpr(this);
    }
}

export class Grouping extends Expr {
    readonly expression: Expr;

    constructor(expression: Expr) {
        super()
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

export class Literal extends Expr {
    readonly value: vObject;

    constructor(value: vObject) {
        super();
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class Unary extends Expr {
    readonly operator: Token;
    readonly right: Expr;

    constructor(operator: Token, right: Expr) {
        super();
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

export class Variable extends Expr {
    readonly name: Token;

    constructor(name: Token) {
        super();
        this.name = name;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
}

export class Assign extends Expr {
    readonly name: Token;
    readonly value: Expr;

    constructor(name: Token, value: Expr) {
        super();
        this.name = name;
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}

export class Logical extends Expr {
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}

export type { Expr, Visitor }