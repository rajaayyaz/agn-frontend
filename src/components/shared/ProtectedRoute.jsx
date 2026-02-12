import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated
 * @param {string} props.type - Type of protection: 'admin' or 'employer'
 * @param {string} props.redirectTo - Where to redirect if not authenticated (default: '/login')
 */
export default function ProtectedRoute({ children, type = 'admin', redirectTo = '/login' }) {
  const isAuthenticated = () => {
    if (type === 'admin') {
      // Check admin authentication
      const adminAuth = localStorage.getItem('agn_admin_authenticated');
      const adminUser = localStorage.getItem('agn_admin_user');
      return adminAuth === '1' && adminUser;
    } else if (type === 'employer') {
      // Check employer authentication
      const employerAuth = localStorage.getItem('agn_employer_authenticated');
      const employerUser = localStorage.getItem('agn_employer_user');
      return employerAuth === '1' && employerUser;
    }
    return false;
  };

  if (!isAuthenticated()) {
    // Not authenticated - redirect to login
    return <Navigate to={redirectTo} replace />;
  }

  // Authenticated - render the protected component
  return children;
}
