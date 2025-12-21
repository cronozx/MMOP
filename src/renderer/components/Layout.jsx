import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { BsX } from 'react-icons/bs';
import { RxHamburgerMenu } from 'react-icons/rx';

const Layout = ({ children, showNavbar = true, showSidebar = true }) => {
    const [menuToggled, setMenuToggled] = useState(false);
    const [dropdownToggled, setDropdownToggled] = useState(false);
    const [username, setUsername] = useState('U')
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        window.db.clearLogin();
        navigate('/login');
    };

    useEffect(() => {
        const getUsername = async () => {
            const name = await window.db.getUsername()
            setUsername(name || 'U')
        }

        getUsername()
    }, [])

    return (
        <div className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
            {showNavbar && (
                <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
                    <div className="flex flex-row p-4 px-6 justify-between items-center">
                        {showSidebar && (
                            <button 
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-white text-xl" 
                                onClick={() => setMenuToggled(!menuToggled)}
                            > 
                                {!menuToggled ? <RxHamburgerMenu /> : <BsX size={24} />} 
                            </button>
                        )}
                        {!showSidebar && <div className="w-10"></div>}
                        
                        <h1 className="text-xl font-bold text-white">
                            {location.pathname === '/' ? 'My Games' : 'MMOP'}
                        </h1>
                        
                        <div className="relative">
                            <button 
                                className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-200 flex items-center justify-center text-white font-bold shadow-lg"
                                onClick={() => setDropdownToggled(!dropdownToggled)}
                            >
                                {username?.charAt(0).toUpperCase() || 'U'}
                            </button>
                            
                            {dropdownToggled && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-700">
                                        <p className="text-sm text-gray-400">Signed in as</p>
                                        <p className="text-sm font-medium text-white truncate">
                                            {username}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {showSidebar && (
                <aside 
                    className={`fixed top-0 left-0 h-full w-64 bg-gray-800/95 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 ease-in-out z-40 ${
                        menuToggled ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="p-6 pt-20">
                        <nav className="space-y-2">
                            <button 
                                onClick={() => {
                                    navigate('/');
                                    setMenuToggled(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                                    location.pathname === '/' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                My Games
                            </button>
                            <button 
                                onClick={() => {
                                    navigate('/create');
                                    setMenuToggled(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                                    location.pathname.includes('/create') 
                                        ? 'bg-purple-600 text-white' 
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                Create
                            </button>
                            <button 
                                onClick={() => {
                                    setMenuToggled(false);
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200"
                            >
                                Settings
                            </button>
                        </nav>
                    </div>
                </aside>
            )}

            {/* Overlay for sidebar */}
            {menuToggled && showSidebar && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30"
                    onClick={() => setMenuToggled(false)}
                />
            )}

            {/* Main Content */}
            <main className={showNavbar ? '' : 'min-h-screen'}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
