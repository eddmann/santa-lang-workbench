/*
 * Santa Lang - Monaco Editor Language Definition
 *
 * A functional, C-like programming language for solving Advent of Code puzzles.
 * https://eddmann.com/santa-lang/
 *
 * This is the canonical Monaco/Monarch tokenizer definition for santa-lang.
 */

import type { languages } from "monaco-editor";

export const conf: languages.LanguageConfiguration = {
  comments: {
    lineComment: "//",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "|", close: "|" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "|", close: "|" },
  ],
  folding: {
    markers: {
      start: /^\s*\{/,
      end: /^\s*\}/,
    },
  },
};

export const language: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".santa",

  keywords: ["let", "mut", "if", "else", "match", "return", "break"],

  constants: ["true", "false", "nil"],

  // Runner DSL section keywords
  sections: ["input", "part_one", "part_two", "test"],

  // Built-in functions
  builtins: [
    // Type conversion
    "int",
    "ints",
    "list",
    "set",
    "dict",
    // Collection access
    "get",
    "size",
    "first",
    "second",
    "last",
    "rest",
    "keys",
    "values",
    // Collection modification
    "push",
    "assoc",
    "update",
    "update_d",
    // Higher-order functions
    "map",
    "filter",
    "flat_map",
    "filter_map",
    "find_map",
    "reduce",
    "fold",
    "fold_s",
    "scan",
    "each",
    "find",
    "count",
    // Aggregation
    "sum",
    "max",
    "min",
    // Sequence operations
    "skip",
    "take",
    "sort",
    "reverse",
    "rotate",
    "chunk",
    // Set operations
    "union",
    "intersection",
    // Predicates
    "includes?",
    "excludes?",
    "any?",
    "all?",
    // Combining
    "zip",
    "repeat",
    "cycle",
    "iterate",
    "combinations",
    // Utility
    "range",
    // String functions
    "lines",
    "split",
    "regex_match",
    "regex_match_all",
    "md5",
    "upper",
    "lower",
    "replace",
    "join",
    // Math
    "abs",
    "signum",
    "vec_add",
    // Bitwise
    "bit_and",
    "bit_or",
    "bit_xor",
    "bit_not",
    "bit_shift_left",
    "bit_shift_right",
    // Miscellaneous
    "id",
    "type",
    "memoize",
    // External (runtime-provided)
    "read",
    "puts",
    "env",
  ],

  operators: [
    "=",
    ">",
    "<",
    "!",
    "==",
    "!=",
    "<=",
    ">=",
    "&&",
    "||",
    "+",
    "-",
    "*",
    "/",
    "%",
    "|>",
    ">>",
    "..",
    "..=",
  ],

  // Symbols used in the language
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  // String escape sequences
  escapes: /\\[nrtbf"\\]/,

  tokenizer: {
    root: [
      // Whitespace
      [/\s+/, ""],

      // Comments
      [/\/\/.*$/, "comment"],

      // Attribute (@slow)
      [/\x40slow\b/, "annotation"],

      // Section labels (Runner DSL) - identifier followed by colon at start context
      [
        /([a-zA-Z_]\w*)(\s*)(:)/,
        {
          cases: {
            "$1@sections": ["keyword.section", "", "delimiter"],
            "@default": ["identifier", "", "delimiter"],
          },
        },
      ],

      // Strings
      [/"/, "string", "@string"],

      // Numbers
      [/\d[\d_]*\.\d[\d_]*/, "number.float"],
      [/\d[\d_]*/, "number"],

      // Lambda pipes
      [/\|/, "delimiter.pipe"],

      // Range operators (must come before symbols)
      [/\.\.=/, "operator.range"],
      [/\.\./, "operator.range"],

      // Pipeline and composition operators
      [/\|>/, "operator.pipe"],
      [/>>/, "operator.compose"],

      // Spread/rest operator
      [/\.\.(?=[a-zA-Z_])/, "operator.spread"],

      // Dictionary literal prefix
      [/#\{/, "delimiter.dict"],

      // Operators
      [
        /[=><!~?:&|+\-*\/\^%]+/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      // Brackets
      [/[{}()\[\]]/, "@brackets"],

      // Identifiers and keywords
      [
        /[a-zA-Z_]\w*\??/,
        {
          cases: {
            "@keywords": "keyword",
            "@constants": "constant",
            "@builtins": "support.function",
            "@default": "identifier",
          },
        },
      ],

      // Placeholder (underscore)
      [/_(?![a-zA-Z0-9])/, "variable.placeholder"],

      // Delimiters
      [/[;,.]/, "delimiter"],
    ],

    string: [
      [/@escapes/, "string.escape"],
      [/[^"\\]+/, "string"],
      [/"/, "string", "@pop"],
    ],
  },
};

/**
 * Register santa-lang with Monaco Editor
 */
export function registerSantaLang(
  monaco: typeof import("monaco-editor")
): void {
  monaco.languages.register({
    id: "santa-lang",
    extensions: [".santa"],
    aliases: ["Santa", "santa-lang", "santa"],
  });

  monaco.languages.setMonarchTokensProvider("santa-lang", language);
  monaco.languages.setLanguageConfiguration("santa-lang", conf);
}
