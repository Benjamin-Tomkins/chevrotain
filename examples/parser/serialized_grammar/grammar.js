const { createToken, Lexer, Parser } = require("chevrotain")

// ----------------- lexer -----------------

const Alpha = createToken({ name: "Alpha", pattern: /A/ })
const Bravo = createToken({ name: "Bravo", pattern: /B/ })
const Charlie = createToken({ name: "Charlie", pattern: /C/ })

const allTokens = [Alpha, Bravo, Charlie]

const SerializedLexer = new Lexer(allTokens, { positionTracking: "onlyOffset" })

// ----------------- parser -----------------

class SerializedParser extends Parser {
    constructor(input, serializedGrammar) {
        // Invoke super constructor with serialized grammar in parser config.
        // Passing in serialized grammar without passing it into the parser
        // would cause parser to always use a stale grammar.
        super(input, allTokens, { serializedGrammar: serializedGrammar })

        // this.RULE calls will be ignored if a serialized grammar is passed in.
        this.RULE("root", () => {
            this.CONSUME(Alpha)
            this.CONSUME(Bravo)
            this.CONSUME(Charlie)
        })

        // this.performSelfAnalysis calls will be ignored as well.
        this.performSelfAnalysis()
    }
}

// ----------------- wrapping it all together -----------------

// try to import serialized grammar in production
var serializedGrammar
if (process.env.NODE_ENV === "production") {
    try {
        serializedGrammar = require("./gen/grammar.json")
    } catch (err) {
        // ignore error
    }
}
// pass in serialized grammar to parser instance
var parser = new SerializedParser([], serializedGrammar)

function parse(text) {
    const lexResult = SerializedLexer.tokenize(text)

    parser.input = lexResult.tokens
    const value = parser.root()

    return {
        value: value, // this is a pure grammar, the value will always be <undefined>
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}

module.exports = {
    parse,
    // export parser so build script can serialize it
    Parser: SerializedParser
}
