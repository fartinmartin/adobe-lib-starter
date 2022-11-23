// https://github.com/motiondeveloper/rollup-plugin-ae-jsx
// TODO: replace with new (@fartinmartin) npm library?
const estreeWalker = require("estree-walker");
const MagicString = require("magic-string");

const whitespace = /[\s;]/; // whitespace or `;`

function removeExports(options = {}) {
	const exports = [];
	return {
		name: "rollup-plugin-remove-exports", // this name will show up in warnings and errors
		generateBundle(options = {}, bundle, isWrite) {
			// format each file to be ae-jsx
			for (const file in bundle) {
				// Get the string code of the file
				let code = bundle[file].code;
				// generate AST to walk through
				let ast;
				try {
					ast = this.parse(code);
				} catch (err) {
					err.message += ` in ${file}`;
					throw err;
				}
				// create magic string to perform operations on
				const magicString = new MagicString(code);

				// removes characters from the magicString
				function remove(start, end) {
					while (whitespace.test(code[start - 1])) start -= 1;
					magicString.remove(start, end);
				}

				// Find exports by looking for expressions
				// that are exports.[exportName] = [exportName];
				estreeWalker.walk(ast, {
					enter(node, parent) {
						if (
							// it's an export expression statement
							node.type === "AssignmentExpression" &&
							node.left.object.name === "exports"
						) {
							remove(node.start, node.end);
							const name = node.right.name;
							console.log(
								`removed [${node.start}-${node.end}] exports.${name} = ${name};`
							);
						}
					},
				});

				// Sanitize output
				magicString.trim();
				// Replace the files code with modified
				bundle[file].code = magicString.toString();
			}
		},
	};
}

module.exports = removeExports;