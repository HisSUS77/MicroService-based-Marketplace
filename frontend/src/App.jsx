import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />
        
        <Route path="cart" element={
          <ProtectedRoute roles={['BUYER', 'ADMIN']}>
            <Cart />
          </ProtectedRoute>
        } />
        
        <Route path="orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        
        <Route path="dashboard" element={
          <ProtectedRoute roles={['SELLER', 'ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
