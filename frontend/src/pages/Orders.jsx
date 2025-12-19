import { useState, useEffect } from 'react';
import { ordersAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const response = await ordersAPI.getMyOrders();
      setOrders(response.data.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-2">Track your purchases and order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <a href="/products" className="btn-primary">
            Browse Products
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Product ID</p>
                    <p className="font-medium text-gray-900">{order.product_id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-medium text-gray-900">{order.quantity} item(s)</p>
                  </div>
                  {order.shipping_address && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Shipping Address</p>
                      <p className="font-medium text-gray-900">{order.shipping_address}</p>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <p className="text-gray-600">Tracking Number</p>
                      <p className="font-medium text-primary-600">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      // Handle cancel order
                      toast.error('Cancel order feature coming soon');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
