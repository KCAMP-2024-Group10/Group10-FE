import { Link } from 'react-router-dom';

function Header() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/main" className="hover:text-yellow-300">Main</Link>
        </li>
        <li>
          <Link to="/report" className="hover:text-yellow-300">Report</Link>
        </li>
        <li>
          <Link to="/info" className="hover:text-yellow-300">Info</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Header;