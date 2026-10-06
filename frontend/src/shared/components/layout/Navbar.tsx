import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/grupos', label: 'Grupos' },
  { to: '/apuntes', label: 'Apuntes' },
  { to: '/foro', label: 'Foro' },
  { to: '/companeros', label: 'Compañeros' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setMobileOpen(false);
  }

  const allNavItems =
    user?.rol === 'ADMINISTRADOR'
      ? [...navItems, { to: '/admin', label: 'Admin' }]
      : navItems;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-duoc-yellow font-bold text-duoc-black">
            DC
          </span>
          <span className="text-lg font-semibold">Duoc Connect</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {allNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-gray-600 transition hover:text-duoc-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <Link
                to="/perfil"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 sm:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow text-xs font-bold">
                  {user.fotoUrl ? (
                    <img src={user.fotoUrl} alt={user.nombre} className="h-full w-full object-cover" />
                  ) : (
                    user.nombre.charAt(0).toUpperCase()
                  )}
                </span>
                {user.nombre.split(' ')[0]}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="rounded-lg bg-duoc-yellow px-4 py-2 text-sm font-semibold text-duoc-black hover:bg-yellow-400"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-gray-100 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {allNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && user && (
              <>
                <Link
                  to="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Mi perfil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Salir
                </button>
              </>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
