import TokenType from "./TokenType";

class Token {
    type: TokenType;
    lexeme: string;
    literal: vObject;
    line: number;

    constructor(type: TokenType, lexeme: string, literal: vObject, line: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    public toString(): string {
        return TokenType[this.type] + " " + this.lexeme + " " + this.literal;
    }
}


export default Token