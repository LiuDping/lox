import TokenType from "./TokenType";
import Token from "./Token";
import Lox from "./Lox";
import { type Expr, Assign, Binary, Call, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import { type Stmt, Print, Expression, Var, Block, If, While, Func, Return } from "./Stmt";

class ParserError extends Error { }

class Parser {
    private readonly tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens
    }

    parse(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.isAtEnd()) {
            const decl: Stmt | null = this.declaration()
            if (decl) {
                statements.push(decl)
            }
        }

        return statements;
    }

    private block(): Stmt[] {
        const statements: Stmt[] = [];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const decl: Stmt | null = this.declaration()
            if (decl) {
                statements.push(decl)
            }
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    }

    private declaration(): Stmt | null {
        try {
            if (this.match(TokenType.FUN)) return this.func('function');
            if (this.match(TokenType.VAR)) return this.varDeclaration();

            return this.statement();
        } catch (error: any) {
            this.synchronize();
            return null;
        }
    }

    private varDeclaration(): Stmt {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        let initializer: Expr | null = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new Var(name, initializer);
    }

    private statement(): Stmt {
        if (this.match(TokenType.PRINT)) return this.printStatement();
        if (this.match(TokenType.RETURN)) return this.returnStatement();
        if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block());
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.WHILE)) return this.whileStatement();
        if (this.match(TokenType.FOR)) return this.forStatement();

        return this.expressionStatement();
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition: Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch: Stmt = this.statement();
        let elseBranch: Stmt | null = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return new If(condition, thenBranch, elseBranch);
    }

    private whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        const condition: Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body: Stmt = this.statement();

        return new While(condition, body);
    }

    private forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        let initializer: Stmt | null;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Expr | null = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body: Stmt = this.statement();

        if (increment != null) {
            body = new Block([body, new Expression(increment)])
        }

        if (condition == null) condition = new Literal(true);
        body = new While(condition, body);

        if (initializer != null) {
            body = new Block([initializer, body]);
        }

        return body;

    }

    private printStatement(): Stmt {
        const value: Expr = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new Print(value);
    }

    private returnStatement(): Stmt {
        const keyword: Token = this.previous();
        let value: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new Return(keyword, value);
    }

    private expressionStatement(): Stmt {
        const expr: Expr = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new Expression(expr);
    }

    private func(kind: string): Func {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect " + kind + " name.");
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after " + kind + " name.");
        const parameters: Token[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }

                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType.COMMA))
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body.");
        const body: Stmt[] = this.block();
        return new Func(name, parameters, body);
    }


    private expression(): Expr {
        return this.assignment();
    }

    private assignment(): Expr {
        const expr: Expr = this.or();
        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();

            if (expr instanceof Variable) {
                const name: Token = expr.name;
                return new Assign(name, value);
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    private or(): Expr {
        let expr: Expr = this.and();

        while (this.match(TokenType.OR)) {
            const operator: Token = this.previous();
            const right: Expr = this.and();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    private and(): Expr {
        let expr: Expr = this.equality();

        while (this.match(TokenType.AND)) {
            const operator: Token = this.previous();
            const right: Expr = this.equality();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    private equality(): Expr {
        let expr: Expr = this.comparison();

        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr = this.comparison();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private comparison(): Expr {
        let expr: Expr = this.term();

        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr = this.term();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private term(): Expr {
        let expr: Expr = this.factor();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.factor();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private factor(): Expr {
        let expr: Expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            return new Unary(operator, right);
        } else {
            return this.call();
        }
    }

    private call(): Expr {
        let expr: Expr = this.primary();

        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else {
                break;
            }
        }

        return expr;
    }

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new Literal(false);
        if (this.match(TokenType.TRUE)) return new Literal(true);
        if (this.match(TokenType.NIL)) return new Literal(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Literal(this.previous().literal);
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return new Variable(this.previous())
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr: Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new Grouping(expr);
        }

        throw this.error(this.peek(), "Expect expression.");
    }

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType.COMMA))
        }


        const paren: Token = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return new Call(callee, paren, args);
    }

    private match(...types: TokenType[]) {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true
            }
        }

        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.peek().type == type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type == TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string) {
        Lox.error(token, message);
        return new ParserError();
    }

    private synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }

            this.advance()
        }
    }
}

export default Parser;