import { SquareStack, Home, FileText, Calendar, BarChart, FileBoxIcon, Settings, Book, ExternalLink, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface NavbarProps {
  onOpenSidebar: () => void;
}

export default function Navbar({ onOpenSidebar }: NavbarProps) {
  const [uniphiMenuOpen, setUniphiMenuOpen] = useState(false);
  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="bg-blue-600 rounded-lg p-1">
          <SquareStack className="text-white h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">BlueCHP Intelligence</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-6">
        <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link href="/projects" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <FileBoxIcon className="h-4 w-4" />
          <span>Projects</span>
        </Link>
        <Link href="/documents" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span>Documents</span>
        </Link>
        <Link href="/manuals" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <Book className="h-4 w-4" />
          <span>Manuals</span>
        </Link>
        <Link href="/projects/1/critical-dates" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Calendar</span>
        </Link>
        <Link href="/diagrams" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span>Diagrams</span>
        </Link>
        <Link href="/projects/1/risks" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <BarChart className="h-4 w-4" />
          <span>Risks</span>
        </Link>
        <Link href="/admin" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
          <Settings className="h-4 w-4" />
          <span>Admin</span>
        </Link>
      </div>
      
      {/* UniPhi Button & User Profile */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            onClick={() => setUniphiMenuOpen(!uniphiMenuOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>UniPhi</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {uniphiMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <a 
                  href="https://bluechp.uniphi.com.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  UniPhi Website
                </a>
                <Link 
                  href="/uniphi" 
                  onClick={() => setUniphiMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  UniPhi Dashboard
                </Link>
                <Link 
                  href="/uniphi/api" 
                  onClick={() => setUniphiMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  API Endpoint Tester
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
          VA
        </div>
      </div>
    </div>
  );
}
