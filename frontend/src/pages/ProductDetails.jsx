import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data.data.product);
    } catch (error) {
      toast.error('Failed to load product details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    // Add to cart and redirect to cart page
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/products')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center gap-2"
      >
        ← Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={product.image_url || 'https://via.placeholder.com/600'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-2">
              {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary-600">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="border-t border-b py-6 my-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center font-bold text-lg"
                >
                  −
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center font-bold text-lg"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">
                  Max: {product.stock}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {product.stock > 0 ? (
              <>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 btn-primary py-4 text-lg"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 btn-secondary py-4 text-lg"
                >
                  Add to Cart
                </button>
              </>
            ) : (
              <button disabled className="flex-1 bg-gray-300 text-gray-500 py-4 text-lg rounded-lg cursor-not-allowed">
                Out of Stock
              </button>
            )}
          </div>

          {/* Product Info Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-1">Seller ID</p>
              <p className="font-semibold text-gray-900">{product.seller_id.slice(0, 8)}...</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-1">Product ID</p>
              <p className="font-semibold text-gray-900">{product.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
