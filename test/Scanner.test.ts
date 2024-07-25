import { expect, test } from "bun:test";
import Scanner from '../src/Scanner'
import Token from "../src/Token";
import TokenType from "../src/TokenType";

const cases = [
    [
        'var a = b',
        [
            new Token(TokenType.VAR, 'var', null, 0),
            new Token(TokenType.IDENTIFIER, 'a', null, 0),
            new Token(TokenType.EQUAL, '=', null, 0),
            new Token(TokenType.IDENTIFIER, 'b', null, 0),
            new Token(TokenType.EOF, '', null, 0)
        ]
    ],
    [
        'a + b',
        [
            new Token(TokenType.IDENTIFIER, 'a', null, 0),
            new Token(TokenType.PLUS, '+', null, 0),
            new Token(TokenType.IDENTIFIER, 'b', null, 0),
            new Token(TokenType.EOF, '', null, 0)
        ]
    ],
    [
        'var a = "abc"',
        [
            new Token(TokenType.VAR, 'var', null, 0),
            new Token(TokenType.IDENTIFIER, 'a', null, 0),
            new Token(TokenType.EQUAL, '=', null, 0),
            new Token(TokenType.STRING, '"abc"', 'abc', 0),
            new Token(TokenType.EOF, '', null, 0)
        ]
    ],
    [
        '5 + 4.4',
        [
            new Token(TokenType.NUMBER, '5', 5, 0),
            new Token(TokenType.PLUS, '+', null, 0),
            new Token(TokenType.NUMBER, '4.4', 4.4, 0),
            new Token(TokenType.EOF, '', null, 0)
        ]
    ],
];

test.each(cases)("%s", (a, expected) => {
    // runs once for each test case provided
    expect(new Scanner(a as string).scanTokens()).toEqual(expected as Token[])
});
