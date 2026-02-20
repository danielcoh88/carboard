import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🚗</span>
          <span className="logo-text">CarBoard</span>
        </Link>
        {isHome && (
          <nav className="header-actions">
            <Link to="/car/new" className="btn btn-primary">
              <span className="btn-icon">+</span>
              הוסף רכב
            </Link>
            <Link to="/import" className="btn btn-secondary">
              <span className="btn-icon">🔗</span>
              ייבוא מלינק
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
