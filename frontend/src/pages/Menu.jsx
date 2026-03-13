
import { useState } from "react";
import { Link } from "react-router-dom";

const Menu = ({ user, onLogout, onClose, onCreateForm }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateForm = async () => {
    if (!onCreateForm || isCreating) return;
    setIsCreating(true);
    try {
      await onCreateForm();
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

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
      <button
        onClick={handleCreateForm}
        disabled={isCreating}
        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isCreating ? "Creating..." : "Create Form"}
      </button>
      <Link
        to="/plans"
        onClick={onClose}
        className="mx-2 my-1 flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-200 via-yellow-100 to-amber-300 px-3 py-2 text-amber-950 hover:from-amber-300 hover:via-yellow-200 hover:to-amber-400 transition-colors border border-amber-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
        Upgrade
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