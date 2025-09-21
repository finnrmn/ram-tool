import json
from pathlib import Path

path = Path("frontend/tsconfig.json")
tsconfig = json.loads(path.read_text())
compiler_options = tsconfig.get("compilerOptions", {})
types = compiler_options.get("types", [])
if "vitest/globals" not in types:
    types.append("vitest/globals")
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types

compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types
compiler_options["types"] = types

tsconfig["compilerOptions"] = compiler_options
includes = tsconfig.get("include", [])
if "./tests" not in includes:
    includes.append("./tests")
tsconfig["include"] = includes
path.write_text(json.dumps(tsconfig, indent=2) + "\n")
