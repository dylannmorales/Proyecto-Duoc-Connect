import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/80 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-duoc-yellow text-[11px] font-extrabold text-duoc-black">
            DC
          </span>
          <p>© {new Date().getFullYear()} Duoc Connect · Colaboración académica Duoc UC</p>
        </div>
        <nav className="flex gap-5" aria-label="Pie de página">
          <Link to="/grupos" className="hover:text-gray-900">Grupos</Link>
          <Link to="/apuntes" className="hover:text-gray-900">Apuntes</Link>
          <Link to="/foro" className="hover:text-gray-900">Foro</Link>
          <Link to="/companeros" className="hover:text-gray-900">Compañeros</Link>
        </nav>
      </div>
    </footer>
  );
}
