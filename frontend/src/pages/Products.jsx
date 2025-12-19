import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ search });
      setProducts(response.data.data.products);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field w-64"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
              <img
                src={product.image_url || 'https://via.placeholder.com/300'}
                alt={product.name}
                className="h-48 w-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-primary-600">
                ${product.price}
              </span>
              <span className="text-sm text-gray-500">
                Stock: {product.stock}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}
