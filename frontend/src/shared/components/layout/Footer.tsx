export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Duoc Connect — Colaboración académica Duoc UC</p>
        <p>Proyecto académico · Fase 6 completada</p>
      </div>
    </footer>
  );
}
