/* eslint-disable */
import { defineConfig } from "vite";
const path = require("path");
import react from "@vitejs/plugin-react";
import pkgJson from './package.json'

const config = {
	libName: "@circle/json-themes"
}

const allExternals = [...Object.keys((pkgJson as any).peerDependencies || {}), ...Object.keys((pkgJson as any).dependencies || {})];

// https://vitejs.dev/config/
export default defineConfig(() => {
	console.log(`Externals: ${allExternals.join(", ")}`)

	return {
		plugins: [
			react({
				jsxRuntime: "classic"
			})
		],
		build: {
			cssCodeSplit: false,
			emptyOutDir: true,
			sourcemap: true,
			minify: true,
			outDir: path.resolve(__dirname, "dist"),
			lib: {
				entry: path.resolve(__dirname, "src/lib/index.ts"),
				name: config.libName,
				fileName: (format) => `index.${format}.js`
			},
			rollupOptions: {
				external: allExternals,
				cache: false,
				treeshake: true,
				output: {
					exports: "named",
					compact: true,
					sourcemap: true,
					minifyInternalExports: false,
					strict: true,
					globals: {
						...Object.fromEntries(
							allExternals.map(key => {
								if(key === "react") return [key, "React"];
								if(key === "react-dom") return [key, "ReactDOM"];

								return [key, key]
							})
						)
					}
				}
			},
			commonjsOptions: {
				sourceMap: false,
				transformMixedEsModules: true,
			}
		},

	}
});
