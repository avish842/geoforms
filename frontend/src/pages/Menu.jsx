
import { Link } from "react-router-dom";

const Menu = ({ user, onLogout, onClose }) => {
  return (
    <div className="absolute right-4 top-16 z-50 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
      <Link
        to="/"
        onClick={onClose}
        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        Home
      </Link>
      <Link
        to="/forms"
        onClick={onClose}
        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        My Forms
      </Link>
      <Link
        to="/profile"
        onClick={onClose}
        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        Profile
      </Link>
      <hr className="my-1 border-gray-200" />
      <button
        onClick={() => { onLogout(); onClose(); }}
        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default Menu;