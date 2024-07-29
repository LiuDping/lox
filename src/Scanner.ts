import Lox from "./Lox";
import TokenType from "./TokenType";
import Token from "./Token";

class Scanner {
    private static readonly keywords: Map<string, TokenType> = new Map<string, TokenType>();

    static {
        const keywords = Scanner.keywords;
        keywords.set("and", TokenType.AND);
        keywords.set("class", TokenType.CLASS);
        keywords.set("else", TokenType.ELSE);
        keywords.set("false", TokenType.FALSE);
        keywords.set("for", TokenType.FOR);
        keywords.set("fun", TokenType.FUN);
        keywords.set("if", TokenType.IF);
        keywords.set("nil", TokenType.NIL);
        keywords.set("or", TokenType.OR);
        keywords.set("print", TokenType.PRINT);
        keywords.set("return", TokenType.RETURN);
        keywords.set("super", TokenType.SUPER);
        keywords.set("this", TokenType.THIS);
        keywords.set("true", TokenType.TRUE);
        keywords.set("var", TokenType.VAR);
        keywords.set("while", TokenType.WHILE);
    }

    private readonly source: string;
    private readonly tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 0;

    constructor(source: string) {
        this.source = source
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken()
        }

        this.tokens.push(new Token(TokenType.EOF, '', null, this.line));

        return this.tokens;
    }

    private scanToken(): void {
        const c: string = this.advance();

        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;

            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;

            case '/':
                if (this.match('/')) {
                    // A comment goes until the end of the line.
                    while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;

            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;

            case '\n':
                this.line++;
                break;

            case '"': this.lstring(); break;


            default: {
                if (this.isDigit(c)) {
                    this.lnumber();
                } else if (this.isAlpha(c)) {
                    this.identifier()
                } else {
                    Lox.error(this.line, "Unexpected character.");
                }
                break;
            }
        }
    }

    private lstring(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            Lox.error(this.line, "Unterminated string.");
            return;
        }

        // 吃进 "
        this.advance();

        const value: string = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    private lnumber(): void {
        while (this.isDigit(this.peek())) this.advance();

        if (this.peek() == '.' && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        const text: string = this.source.substring(this.start, this.current);
        let type: TokenType | undefined = Scanner.keywords.get(text);
        if (!type) type = TokenType.IDENTIFIER;

        this.addToken(type);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false
        if (this.source.charAt(this.current) != expected) return false

        // 如果是匹配成功，则需吃进一个字母
        this.current++;
        return false
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current)
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9'
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++)
    }

    private addToken(type: TokenType): void;
    private addToken(type: TokenType, literal: vObject): void;
    private addToken(type: TokenType, literal?: vObject): void {
        const text: string = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal ? literal : null, this.line));
    }
}

export default Scanner