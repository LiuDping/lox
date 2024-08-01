import type { Expr } from "./Expr";
import type Token from "./Token";

abstract class Stmt {
    abstract accept<R>(visitor: Visitor<R>): R;
}

interface Visitor<R> {
    visitBlockStmt(stmt: Block): R;
    visitIfStmt(stmt: If): R;
    visitWhileStmt(stmt: While): R;
    visitExpressionStmt(stmt: Expression): R;
    visitPrintStmt(stmt: Print): R;
    visitReturnStmt(stmt: Return): R;
    visitVarStmt(stmt: Var): R;
    visitFuncStmt(stmt: Func): R;
}

export class Block extends Stmt {
    readonly statements: Stmt[];

    constructor(statements: Stmt[]) {
        super();
        this.statements = statements;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

export class If extends Stmt {
    readonly condition: Expr;
    readonly thenBranch: Stmt;
    readonly elseBranch: Stmt | null;

    constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
        super();
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }


    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

export class While extends Stmt {
    readonly condition: Expr;
    readonly body: Stmt;

    constructor(condition: Expr, body: Stmt) {
        super();
        this.condition = condition;
        this.body = body;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

export class Expression extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}

export class Print extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}

export class Return extends Stmt {
    readonly keyword: Token;
    readonly value: Expr | null;

    constructor(keyword: Token, value: Expr | null) {
        super();
        this.keyword = keyword;
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}

export class Var extends Stmt {
    readonly name: Token;
    readonly initializer: Expr | null;

    constructor(name: Token, initializer: Expr | null) {
        super();
        this.name = name;
        this.initializer = initializer;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitVarStmt(this);
    }
}

export class Func extends Stmt {
    readonly name: Token;
    readonly params: Token[];
    readonly body: Stmt[];

    constructor(name: Token, params: Token[], body: Stmt[]) {
        super();
        this.name = name;
        this.params = params;
        this.body = body;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitFuncStmt(this);
    }
}


export type { Stmt, Visitor }