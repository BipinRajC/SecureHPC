import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <AlertTriangle size={64} className="text-error-500 mb-6" />
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
      <p className="text-neutral-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary inline-flex items-center">
        <Home size={18} className="mr-2" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;