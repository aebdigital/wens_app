import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface StyledNavLinkProps {
  to: string;
  children: React.ReactNode;
}

const StyledNavLink: React.FC<StyledNavLinkProps> = ({ to, children }) => {
  const location = useLocation();
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        // Handle the special case where root path should highlight 'Spis'
        const isHome = to === '/spis' && location.pathname === '/';
        const active = isActive || isHome;
        
        return `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
          active
            ? 'bg-white/30 backdrop-blur-md shadow-lg'
            : 'hover:bg-white/10'
        }`;
      }}
    >
      {children}
    </NavLink>
  );
};

export default StyledNavLink;
