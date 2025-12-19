import { useState, useEffect } from 'react';
import { productsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      // Filter by current user's products
      const myProducts = response.data.data.products.filter(
        p => p.seller_id === user?.id
      );
      setProducts(myProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(productData);
        toast.success('Product created successfully');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', stock: '', category: '', image_url: '' });
      fetchMyProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image_url: product.image_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchMyProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Products Dashboard</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', stock: '', category: '', image_url: '' });
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., MacBook Pro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  placeholder="99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input-field"
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                placeholder="e.g., Electronics, Books, Clothing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input-field"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {products.map((product) => (
          <div key={product.id} className="card flex gap-6">
            <img
              src={product.image_url || 'https://via.placeholder.com/200'}
              alt={product.name}
              className="w-48 h-48 object-cover rounded"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex gap-6 mb-4 text-sm text-gray-600">
                <span>Category: <strong>{product.category}</strong></span>
                <span>Price: <strong className="text-primary-600">${product.price}</strong></span>
                <span>Stock: <strong>{product.stock}</strong></span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(product)}
                  className="btn-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any products yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create Your First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
