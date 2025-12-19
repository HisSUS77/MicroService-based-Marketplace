import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    const success = await registerUser(userData);
    if (success) {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email'
                  }
                })}
                type="email"
                className="input-field mt-1"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must contain uppercase, lowercase, and number'
                  }
                })}
                type="password"
                className="input-field mt-1"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                className="input-field mt-1"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="input-field mt-1"
              >
                <option value="">Select role</option>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
