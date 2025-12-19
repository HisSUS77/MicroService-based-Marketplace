import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, paymentsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [isAuthenticated]);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  };

  const updateQuantity = (index, newQuantity) => {
    const updatedCart = [...cart];
    if (newQuantity <= 0) {
      updatedCart.splice(index, 1);
    } else if (newQuantity <= updatedCart[index].product.stock) {
      updatedCart[index].quantity = newQuantity;
    } else {
      toast.error('Not enough stock available');
      return;
    }
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    setLoading(true);

    try {
      // Process each cart item as a separate order
      const orderPromises = cart.map(async (item) => {
        // Create order
        const orderResponse = await ordersAPI.create({
          product_id: item.product.id,
          quantity: item.quantity,
          total_amount: item.product.price * item.quantity,
          shipping_address: shippingAddress,
        });

        const order = orderResponse.data.data.order;

        // Process payment (mock)
        await paymentsAPI.process({
          order_id: order.id,
          amount: order.total_amount,
          payment_method: paymentMethod,
          card_number: '4111111111111111', // Mock card number
          cvv: '123', // Mock CVV
          expiry_date: '12/25', // Mock expiry
        });

        return order;
      });

      await Promise.all(orderPromises);

      // Clear cart
      localStorage.removeItem('cart');
      setCart([]);

      toast.success('Orders placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div key={index} className="card flex gap-6">
                <img
                  src={item.product.image_url || 'https://via.placeholder.com/150'}
                  alt={item.product.name}
                  className="w-32 h-32 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{item.product.category}</p>
                  <p className="text-xl font-bold text-primary-600 mb-4">
                    ${parseFloat(item.product.price).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Shipping Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Enter your full shipping address"
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="credit_card">Credit Card (Mock)</option>
                  <option value="debit_card">Debit Card (Mock)</option>
                  <option value="paypal">PayPal (Mock)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  * This is a mock payment system for demonstration
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full py-3 text-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Secure checkout with encrypted payment processing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
