import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Git for CVs
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage your resume like code: branch, version, and tailor for different roles 
            while preserving ATS formatting. Never lose track of your career story again.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </Link>
            <Link 
              href="/demo" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 text-lg px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Resume Branches?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Preserve ATS Formatting</h3>
              <p className="text-gray-600">
                Keep your original DOCX structure intact. Our system only edits text content, 
                never layouts or styles that could break ATS parsing.
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Version Control</h3>
              <p className="text-gray-600">
                Create branches for different career paths: ML Engineer, Backend Dev, Research. 
                Track every change with full history and rollback capability.
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Tailoring</h3>
                <p className="text-gray-600">
                  Never wonder &quot;what did I tell them about my React experience?&quot; again.
                </p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Public Sharing</h3>
              <p className="text-gray-600">
                Publish selected versions as stable, trackable links. Perfect for portfolios, 
                applications, or quick sharing with recruiters.
              </p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Applications</h3>
                <p className="text-gray-600">
                  Keep a complete record of which version you sent where. Never wonder 
                  &quot;what did I tell them about my React experience?&quot; again.
                </p>
            </div>

            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your data stays yours. Work on private versions, share only what you choose, 
                and maintain complete control over your professional narrative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Master Resume</h3>
                <p className="text-gray-600">
                  Start with your best ATS-formatted DOCX file. This becomes your canonical source of truth.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Specialization Branches</h3>
                <p className="text-gray-600">
                  Branch into different career paths: &quot;ML Engineer&quot;, &quot;Backend Developer&quot;, &quot;Research Scientist&quot;. 
                  Each branch maintains its connection to your master resume.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tailor for Specific Roles</h3>
                <p className="text-gray-600">
                  For each application, create a submission that fine-tunes your branch for that specific company and role. 
                  Track everything with full history.
                </p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share and Track</h3>
                <p className="text-gray-600">
                  Publish selected versions as public links for portfolios or quick sharing. 
                  Always know which version went where.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Version Your Career?
          </h2>
          <p className="text-gray-600 mb-8">
            Join developers who manage their resumes like they manage their code.
          </p>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Start Your CV Tree
          </Link>
        </div>
      </section>
    </div>
  );
}
