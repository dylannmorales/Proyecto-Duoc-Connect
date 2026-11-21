import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Avatar } from '@/shared/components/ui/Avatar';
import { IconLogout } from '@/shared/components/ui/Icons';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/grupos', label: 'Grupos' },
  { to: '/apuntes', label: 'Apuntes' },
  { to: '/foro', label: 'Foro' },
  { to: '/companeros', label: 'Compañeros' },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3.5 py-2 text-sm font-medium transition ${
    isActive ? 'bg-duoc-ink text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
  }`;
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-duoc-yellow text-sm font-extrabold text-duoc-black shadow-sm">
        DC
      </span>
      <span className="text-lg font-bold tracking-tight">
        Duoc <span className="text-gray-500">Connect</span>
      </span>
    </span>
  );
}

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
    user?.rol === 'ADMINISTRADOR' ? [...navItems, { to: '/admin', label: 'Admin' }] : navItems;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" onClick={() => setMobileOpen(false)} aria-label="Duoc Connect, inicio">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {allNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={'end' in item} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <Link
                to="/perfil"
                className="hidden items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 text-sm font-medium transition hover:border-gray-300 hover:bg-gray-50 sm:flex"
              >
                <Avatar nombre={user.nombre} fotoUrl={user.fotoUrl} size="sm" />
                {user.nombre.split(' ')[0]}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="icon-btn hidden sm:inline-flex"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <IconLogout />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="rounded-full bg-duoc-yellow px-4 py-2 text-sm font-semibold text-duoc-black shadow-sm hover:bg-duoc-yellow-dark"
              >
                Crear cuenta
              </Link>
            </>
          )}

          <button
            type="button"
            className="icon-btn lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden" aria-label="Menú móvil">
          <div className="flex flex-col gap-1">
            {allNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-duoc-yellow-soft text-gray-950' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium"
                >
                  <Avatar nombre={user.nombre} fotoUrl={user.fotoUrl} size="sm" />
                  Mi perfil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
