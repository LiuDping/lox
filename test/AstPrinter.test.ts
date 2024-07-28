import { expect, test } from "bun:test";
import { Binary, Grouping, Literal, Unary, type Expr } from "../src/Expr";
import Token from "../src/Token";
import TokenType from "../src/TokenType";
import AstPrinter from '../src/AstPrinter'


test('(* (- 123) (group 45.67))', () => {
    const expression: Expr = new Binary(
        new Unary(
            new Token(TokenType.MINUS, '-', null, 1),
            new Literal(123)
        ),
        new Token(TokenType.STAR, '*', null, 1),
        new Grouping(new Literal(45.67))
    )
    expect(new AstPrinter().print(expression)).toBe('(* (- 123) (group 45.67))')
})