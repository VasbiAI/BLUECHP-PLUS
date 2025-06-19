export default function Configuration() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
      <p className="text-gray-700 mb-6">The project uses TypeScript, ESLint, and Prettier for code quality and consistency across the codebase.</p>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Root TypeScript Config</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Package.json</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">ESLint</button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// tsconfig.json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Vite Configuration</h3>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Drizzle Configuration</h3>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});`}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Tailwind Configuration</h3>
        <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
          <pre>
{`// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ...other colors
      },
      // ...other theme extensions
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;`}
          </pre>
        </div>
      </div>
    </>
  );
}
