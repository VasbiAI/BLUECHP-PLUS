export default function ProjectStructure() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Project Structure</h2>
      <p className="text-gray-700 mb-6">
        The project uses a monorepo structure with separate client and server directories, allowing for shared types and configurations while maintaining clear separation of concerns.
      </p>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Directory Structure</h3>
        <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
          <pre>
{`// Project Root Structure
myproject/
├── package.json      // Monorepo root package
├── tsconfig.json     // Base TypeScript config
├── node_modules/     // Shared node modules
├── client/          // Frontend React application
│   ├── src/          // Frontend source code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/          // Backend Express application
│   ├── index.ts      // Server entry point
│   ├── routes.ts     // API routes
│   ├── storage.ts    // Storage interface
│   └── db.ts         // Database connection
└── shared/          // Shared code between client and server
    └── schema.ts     // Shared TypeScript types`}
          </pre>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium">Client Structure</h3>
          </div>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// Client Directory Structure
client/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ProjectStructure.tsx
│   │   ├── Configuration.tsx
│   │   ├── Frontend.tsx
│   │   ├── Backend.tsx
│   │   ├── Database.tsx
│   │   └── not-found.tsx
│   ├── lib/
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── index.html`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0
               11-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium">Server Structure</h3>
          </div>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// Server Directory Structure
server/
├── index.ts        // Server entry point
├── routes.ts       // API routes registration
├── storage.ts      // Storage interface
├── db.ts           // Database connection
└── vite.ts         // Vite integration`}
            </pre>
          </div>
        </div>
      </div>
      
      <div id="scripts" className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Scripts</h2>
        <p className="text-gray-700 mb-6">The project includes various npm scripts for development, building, and running the application.</p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Available Scripts</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4 font-medium">Command</th>
                <th className="text-left py-2 px-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-mono bg-gray-50">npm run dev</td>
                <td className="py-2 px-4">Start the development server (both client and server)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-mono bg-gray-50">npm run build</td>
                <td className="py-2 px-4">Build the client and server for production</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-mono bg-gray-50">npm run start</td>
                <td className="py-2 px-4">Start the production server</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-mono bg-gray-50">npm run check</td>
                <td className="py-2 px-4">Run TypeScript type checking</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-mono bg-gray-50">npm run db:push</td>
                <td className="py-2 px-4">Push schema changes to the database</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div id="dev-environment" className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Development Environment</h2>
        <p className="text-gray-700 mb-6">The project includes a streamlined development environment with hot reloading for both client and server.</p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Environment Features</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Client and server hot reloading</li>
            <li>Shared type definitions between frontend and backend</li>
            <li>ESLint and TypeScript integration</li>
            <li>Development server that proxies API requests</li>
            <li>Debug-friendly error messages and stack traces</li>
          </ul>
        </div>
      </div>
      
      <div id="deployment" className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Deployment</h2>
        <p className="text-gray-700 mb-6">The project can be deployed to various cloud platforms with proper environment configuration.</p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Deployment Configuration</h3>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`# Environment Variables Needed
# Server Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# PostgreSQL Configuration (If needed separately)
PGDATABASE=dbname
PGHOST=localhost
PGPASSWORD=password
PGPORT=5432
PGUSER=user`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
