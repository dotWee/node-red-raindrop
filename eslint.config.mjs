import js from "@eslint/js";
import globals from "globals";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import mochaPlugin from "eslint-plugin-mocha";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js, mochaPlugin }, extends: ["mochaPlugin/recommended"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
]);
