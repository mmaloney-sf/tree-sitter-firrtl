/**
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


module.exports = grammar({
  name: 'firrtl',

  externals: $ => [
    $.newline,
    $.indent,
    $.dedent,
  ],

  extras: $ => [
    $.comment,
    /\s/
  ],

  inline: $ => [
    $.keyword_identifier
  ],

  supertypes: $ => [
    $.expression,
    $.statement
  ],

  word: $ => $.identifier,

  rules: {
  id: _ => /[a-zA-Z_][a-zA-Z0-9_$]*/, // LegalStartChar (LegalIdChar)*
    circuit: $ => seq($.version, $.newline, "circuit", $.id, ":", optional($.annotations), optional($.info), $.newline, $.indent, repeat($.decl), $.dedent, ),
    decl: $ => choice($.decl_module, $.decl_extmodule, $.decl_layer, $.decl_type_alias, ),
    decl_module: $ => seq(optional("public"), "module", $.id, repeat($.enablelayer), ":", optional($.info), $.newline, $.indent, repeat(seq($.port, $.newline, )), repeat(seq($.statement, $.newline, )), $.dedent, ),
    decl_extmodule: $ => seq("extmodule", $.id, ":", optional($.info), $.newline, $.indent, repeat(seq($.port, $.newline, )), optional(seq("defname", "=", $.id, $.newline, )), repeat(seq("parameter", $.id, "=", $.type_param, $.newline, )), $.dedent, ),
    decl_layer: $ => seq("layer", $.id, $.string, ":", optional($.info), $.newline, $.indent, repeat(seq($.decl_layer, $.newline, )), $.dedent, ),
    decl_type_alias: $ => seq("type", $.id, "=", $.type, ),
    port: $ => seq(choice("input", "output", ), $.id, ":", choice($.type, $.type_property, ), optional($.info), ),
    type_param: $ => choice($.int, $.string_dq, $.string_sq, ),
    type_property: $ => "Integer",
    statement: $ => choice($.circuit_component, $.connectlike, $.conditional, $.command, $.layerblock, $.skip, ),
    circuit_component: $ => choice($.circuit_component_node, $.circuit_component_wire, $.circuit_component_reg, $.circuit_component_inst, $.circuit_component_mem, ),
    circuit_component_node: $ => seq("node", $.id, "=", $.expr, optional($.info), ),
    circuit_component_wire: $ => seq("wire", $.id, ":", $.type, optional($.info), ),
    circuit_component_inst: $ => seq("inst", $.id, "of", $.id, optional($.info), ),
    circuit_component_reg: $ => choice(seq("reg", $.id, ":", $.type, ",", $.expr, optional($.info), ), seq("regreset", $.id, ":", $.type, ",", $.expr, ",", $.expr, ",", $.expr, optional($.info), ), ),
    circuit_component_mem: $ => seq("mem", $.id, ":", optional($.info), $.newline, $.indent, "data-type", "=>", $.type, $.newline, "depth", "=>", $.int, $.newline, "read-latency", "=>", $.int, $.newline, "write-latency", "=>", $.int, $.newline, "read-under-write", "=>", $.read_under_write, $.newline, repeat(seq("reader", "=>", $.id, $.newline, )), repeat(seq("writer", "=>", $.id, $.newline, )), repeat(seq("readwriter", "=>", $.id, $.newline, )), $.dedent, ),
    read_under_write: $ => choice("old", "new", "undefined", ),
    connectlike: $ => choice(seq("connect", $.reference, ",", $.expr, optional($.info), ), seq("invalidate", $.reference, optional($.info), ), seq("attach", "(", $.reference, repeat(seq(",", $.reference, )), ")", optional($.info), ), seq("define", $.reference_static, "=", $.expr_probe, optional($.info), ), seq("propassign", $.reference_static, ",", $.property_expr, optional($.info), ), ),
    conditional: $ => choice($.conditional_when, $.conditional_match, ),
    conditional_when: $ => seq("when", $.expr, ":", optional($.info), $.newline, $.indent, $.statement, repeat($.statement), $.dedent, optional(seq("else", ":", $.indent, $.statement, repeat($.statement), $.dedent, )), ),
    conditional_match: $ => seq("match", $.expr, ":", optional($.info), $.newline, optional(seq($.indent, repeat($.conditional_match_branch), $.dedent, )), ),
    conditional_match_branch: $ => seq($.id, optional(seq("(", $.id, ")", )), ":", $.newline, optional(seq($.indent, repeat($.statement), $.dedent, )), ),
    command: $ => choice(seq("stop", "(", $.expr, ",", $.expr, ",", $.int, ")", optional($.info), ), seq("force", "(", $.expr, ",", $.expr, ",", $.expr_probe, ",", $.expr, ")", ), seq("force_initial", "(", $.expr_probe, ",", $.expr, ")", ), seq("release", "(", $.expr, ",", $.expr, ",", $.expr_probe, ")", ), seq("release_initial", "(", $.expr_probe, ")", ), seq($.expr_intrinsic, optional($.info), ), seq("printf", "(", $.expr, ",", $.expr, ",", $.string_dq, repeat(seq(",", $.expr, )), ")", optional(seq(":", $.id, )), optional($.info), ), seq("assert", "(", $.expr, ",", $.expr, ",", $.expr, ",", $.string_dq, repeat(seq(",", $.expr, )), ")", optional(seq(":", $.id, )), optional($.info), ), seq("assume", "(", $.expr, ",", $.expr, ",", $.expr, ",", $.string_dq, repeat(seq(",", $.expr, )), ")", optional(seq(":", $.id, )), optional($.info), ), seq("cover", "(", $.expr, ",", $.expr, ",", $.expr, ",", $.string_dq, ")", optional(seq(":", $.id, )), optional($.info), ), ),
    layerblock: $ => seq("layerblock", $.id, "of", $.id, ":", optional($.info), $.newline, $.indent, repeat(seq($.port, $.newline, )), repeat(seq($.statement, $.newline, )), $.dedent, ),
    skip: $ => seq("skip", optional($.info), ),
    reference: $ => choice($.reference_static, $.reference_dynamic, ),
    reference_static: $ => choice($.id, seq($.reference_static, ".", $.id, ), seq($.reference_static, "[", $.int, "]", ), ),
    reference_dynamic: $ => choice(seq($.reference_static, "[", $.expr, "]", ), seq($.reference_dynamic, "[", $.expr, "]", ), ),
    expr: $ => choice($.expr_reference, $.expr_lit, $.expr_enum, $.expr_mux, $.expr_read, $.expr_primop, $.expr_intrinsic, ),
    expr_reference: $ => $.reference,
    expr_lit: $ => seq(choice("UInt", "SInt", ), optional($.width), "(", choice($.int, $.rint, ), ")", ),
    expr_enum: $ => seq($.type_enum, "(", $.id, optional(seq(",", $.expr, )), ")", ),
    expr_mux: $ => seq("mux", "(", $.expr, ",", $.expr, ",", $.expr, ")", ),
    expr_read: $ => seq("read", "(", $.expr_probe, ")", ),
    expr_probe: $ => choice(seq("probe", "(", $.reference_static, ")", ), seq("rwprobe", "(", $.reference_static, ")", ), $.reference_static, ),
    property_literal_expr: $ => seq("Integer", "(", $.int, ")", ),
    property_expr: $ => choice($.reference_static, $.property_literal_expr, $.property_expr_primop, ),
    property_expr_primop: $ => $.property_primop_2expr,
    expr_primop: $ => seq($.id, "(", optional($.arglist), ")", ),
    arglist: $ => choice(seq($.arg, optional(","), ), seq($.arg, ",", $.arglist, ), ),
    arg: $ => choice($.expr, $.int, ),
    expr_intrinsic: $ => seq("intrinsic", "(", $.id, optional(seq("<", "parameter", $.id, "=", choice($.int, $.string_dq, ), repeat(seq(",", "parameter", $.id, "=", choice($.int, $.string_dq, ), )), ">", )), optional(seq(":", $.type, )), repeat(seq(",", $.expr, )), ")", ),
    type: $ => choice($.type_hardware, $.type_probe, ),
    type_hardware: $ => choice($.type_ground, $.type_bundle, $.type_vec, $.type_enum, $.id, ),
    type_ground: $ => choice($.type_ground_nowidth, $.type_ground_width, ),
    type_ground_nowidth: $ => choice("Clock", "Reset", "AsyncReset", ),
    type_ground_width: $ => choice(seq("UInt", optional($.width), ), seq("SInt", optional($.width), ), seq("Analog", optional($.width), ), ),
    width: $ => seq("<", $.int, ">", ),
    type_bundle: $ => seq("{", $.type_bundle_field, repeat($.type_bundle_field), "}", ),
    type_bundle_field: $ => seq(optional("flip"), $.id, ":", $.type, ),
    type_vec: $ => seq($.type, "[", $.int, "]", ),
    type_enum: $ => seq("{|", repeat($.type_enum_alt), "|}", ),
    type_enum_alt: $ => seq($.id, optional(seq(":", $.type, )), ),
    type_probe: $ => seq(choice("Probe", "RWProbe", ), "<", $.type, optional(seq(",", $.id, )), ">", ),
    enablelayer: $ => seq("enablelayer", $.id, repeat(seq(".", $.id, )), ),
    annotations: $ => seq("%", "[", $.json_array, "]", ),
    sem_ver: $ => seq($.int, ".", $.int, ".", $.int, ),
    version: $ => seq("FIRRTL", "version", $.sem_ver, ),
    int: $ => seq(optional("-"), $.digit_dec, repeat($.digit_dec), ),
    digit_bin: $ => choice("0", "1", ),
    digit_oct: $ => choice($.digit_bin, "2", "3", "4", "5", "6", "7", ),
    digit_dec: $ => choice($.digit_oct, "8", "9", ),
    digit_hex: $ => choice($.digit_dec, "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f", ),
    rint: $ => choice(seq(optional("-"), "0b", $.digit_bin, repeat($.digit_bin), ), seq(optional("-"), "0o", $.digit_oct, repeat($.digit_oct), ), seq(optional("-"), "0d", $.digit_oct, repeat($.digit_dec), ), seq(optional("-"), "0h", $.digit_hex, repeat($.digit_hex), ), ),
    literal_id: $ => seq("`", choice("_", $.letter, $.digit_dec, ), repeat(choice("_", $.letter, $.digit_dec, )), "`", ),
    letter: $ => choice("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", ),
    info: $ => seq("@", "[", $.lineinfo, repeat(seq(",", $.lineinfo, )), "]", ),
    lineinfo: $ => seq($.string, " ", $.linecol, ),
    linecol: $ => seq($.digit_dec, repeat($.digit_dec), ":", $.digit_dec, repeat($.digit_dec), ),
  }
});
