import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingCartIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Secure Marketplace
              </span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/products"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600"
              >
                Products
              </Link>
              
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600"
                >
                  Orders
                </Link>
              )}
              
              {user?.role === 'SELLER' || user?.role === 'ADMIN' ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600"
                >
                  Dashboard
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {user?.role === 'BUYER' || user?.role === 'ADMIN' ? (
                  <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500">
                    <ShoppingCartIcon className="h-6 w-6" />
                  </Link>
                ) : null}
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.email}
                    </span>
                    <span className="ml-2 px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
