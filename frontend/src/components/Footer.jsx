export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Secure Marketplace</h3>
            <p className="text-gray-400 text-sm">
              A production-grade, secure microservices-based online marketplace platform.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Zero Trust Architecture</li>
              <li>✓ OWASP ASVS v5 Compliant</li>
              <li>✓ End-to-End Encryption</li>
              <li>✓ Role-Based Access Control</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Project Info</h3>
            <p className="text-gray-400 text-sm">
              Course: CYC386 – Secure Software Design & Development<br />
              Institution: COMSATS University Islamabad<br />
              Semester: Fall 2025
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>&copy; 2025 Secure Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
