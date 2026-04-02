import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Resume Branches
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/docs" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Docs
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
