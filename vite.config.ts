/* eslint-disable */
import { defineConfig } from "vite";
const path = require("path");
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	css: {},
	build: {
		minify: false,
		sourcemap: true,
		cssCodeSplit: false,
		emptyOutDir: false,
		outDir: path.resolve(__dirname, "dist"),
		lib: {
			entry: path.resolve(__dirname, "src/lib/index.ts"),
			name: "@circle/json-themes",
			fileName: (format) => `index.${format}.js`
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			cache: false,
			output: {
				exports: "named",
				globals: {
					react: "React",
					"react-dom": "ReactDOM"
				}
			}
		},
		commonjsOptions: {
			transformMixedEsModules: true
		}
	}
});
