use std::fmt::Write;
use std::sync::Arc;

use lalrpop_util::lalrpop_mod;

lalrpop_mod!(grammar);

pub type Ident = String;

#[derive(Debug)]
pub struct Grammar(Vec<Rule>);

#[derive(Debug)]
pub struct Rule(Ident, Arc<Expr>);

#[derive(Debug)]
pub enum Expr {
    Nonterminal(Ident),
    Terminal(Ident),
    Sequence(Vec<Arc<Expr>>),
    Choice(Vec<Arc<Expr>>),
    Repeat(Arc<Expr>),
    Optional(Arc<Expr>),
}

impl Grammar {
    pub fn rules(&self) -> &[Rule] {
        &self.0
    }
}

fn main() {
    let args: Vec<String> = std::env::args().into_iter().collect();
    let grammar_filename = &args[1];
    let js_filename = &args[2];

    let grammar = std::fs::read_to_string(grammar_filename).unwrap();
    let parser = grammar::GrammarParser::new();
    let grammar: Grammar = parser.parse(grammar.as_str()).unwrap();

    let mut output = String::new();

    writeln!(output, "{PRELUDE}

module.exports = grammar({{
  name: 'firrtl',

  externals: $ => [
    $.newline,
    $.indent,
    $.dedent,
  ],

  extras: $ => [
    $.comment,
    /\\s/
  ],

  inline: $ => [
    $.keyword_identifier
  ],

  supertypes: $ => [
    $.expression,
    $.statement
  ],

  word: $ => $.identifier,

  rules: {{").unwrap();
    writeln!(output, "  id: _ => /[a-zA-Z_][a-zA-Z0-9_$]*/, // LegalStartChar (LegalIdChar)*").unwrap();

    for Rule(nonterminal, expr) in grammar.rules() {
        write!(output, r#"    {nonterminal}: $ => "#).unwrap();
        print_expr(&mut output, &expr);
        writeln!(output, ",").unwrap();
    }

    writeln!(output, "  }}").unwrap();
    writeln!(output, "}});").unwrap();
    std::fs::write(js_filename, output).unwrap();
}

fn print_expr(output: &mut dyn Write, expr: &Expr) {
    match expr {
        Expr::Nonterminal(nonterm) => write!(output, "$.{nonterm}").unwrap(),
        Expr::Terminal(term) => write!(output, r#""{term}""#).unwrap(),
        Expr::Sequence(es) => {
            write!(output, "seq(").unwrap();
            for e in es {
                print_expr(output, e);
                write!(output, ", ").unwrap();
            }
            write!(output, ")").unwrap();
        },
        Expr::Choice(es) => {
            write!(output, "choice(").unwrap();
            for e in es {
                print_expr(output, e);
                write!(output, ", ").unwrap();
            }
            write!(output, ")").unwrap();
        },
        Expr::Repeat(e) => {
            write!(output, "repeat(").unwrap();
            print_expr(output, e);
            write!(output, ")").unwrap();
        },
        Expr::Optional(e) => {
            write!(output, "optional(").unwrap();
            print_expr(output, e);
            write!(output, ")").unwrap();
        },
    }
}

const PRELUDE: &'static str = r#"/**
 * @file FIRRTL grammar for tree-sitter
 * @author Aliaksei Chapyzhenka <alex.drom@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @author Andrew Young <youngar17@gmail.com>
 * @license Apache-2.0
 * @see {@link https://www.chisel-lang.org/firrtl|official website}
 * @see {@link https://github.com/chipsalliance/firrtl|official repository}
 * @see {@link https://github.com/chipsalliance/firrtl-spec|official spec}
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

'use strict';
"#;
