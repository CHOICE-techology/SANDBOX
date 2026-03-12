import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const rawPrivyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const sanitizedPrivyAppId = typeof rawPrivyAppId === 'string' ? rawPrivyAppId.trim() : '';
const hasValidPrivyAppId = Boolean(sanitizedPrivyAppId) && ![
  'undefined',
  'null',
  'your-privy-app-id',
  'changeme',
].includes(sanitizedPrivyAppId.toLowerCase());

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!hasValidPrivyAppId) {
    return <>{children}</>;
  }

  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm font-semibold text-muted-foreground">Checking secure session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
