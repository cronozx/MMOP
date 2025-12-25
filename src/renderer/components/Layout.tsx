import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { BsX } from 'react-icons/bs';
import { RxHamburgerMenu } from 'react-icons/rx';
import { FiBell } from 'react-icons/fi';
import { NotifiactionType } from '../../types/sharedTypes';

interface LayoutProps {
    children: React.ReactNode;
    showNavbar?: boolean;
    showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar = true, showSidebar = true }) => {
    const [menuToggled, setMenuToggled] = useState<boolean>(false);
    const [dropdownToggled, setDropdownToggled] = useState<boolean>(false);
    const [notificationsToggled, setNotificationsToggled] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('U')
    const [notifications, setNotifications] = useState<NotifiactionType[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar navigation items
    const sidebarLinks = [
        { name: 'Home', path: '/' },
        { name: 'Modpacks', path: '/modpacks' },
        { name: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        window.db.clearLogin();
        navigate('/login');
    };

    useEffect(() => {
        const getUsername = async () => {
            const data = await window.db.getUserDataFromToken()
            setUsername(data?.username || 'U')
        }

        getUsername()
    }, [])

    useEffect(() => {
        const getNotifications = async () => {
            const token = await window.db.getAuthToken();
            if (!token) {
                return;
            }

            const _id = (await window.db.getUserDataFromToken())?._id;
            if (!_id) {
                return;
            }

            setNotifications(await window.db.getNotifications(token, _id));
        }

        getNotifications();
    }, [navigate])

    const handleRequest = async (notification: NotifiactionType, action: boolean) => {
        const token = await window.db.getAuthToken();
        if (!token || !notification.modpack_Id) {
            return;
        }

        await window.db.handleRequestAction(token, notification.modpack_Id, action);
        await window.db.removeNotification(token, notification.id);
    }

    const handleRead = async () => {
        const token = await window.db.getAuthToken();
        if (!token) {
            return;
        }

        window.db.markNotificationsAsRead(token);

        const _id = (await window.db.getUserDataFromToken())?._id;
        if (_id) {
            setNotifications(await window.db.getNotifications(token, _id));
        }
    }

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
            {showNavbar && (
                <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
                    <div className="flex flex-row p-4 px-6 justify-between items-center">
                        <div className="flex items-center w-30">
                            {showSidebar && (
                                <button 
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-white text-xl" 
                                    onClick={() => setMenuToggled(!menuToggled)}
                                > 
                                    {!menuToggled ? <RxHamburgerMenu /> : <BsX size={24} />} 
                                </button>
                            )}
                            {!showSidebar && <div className="w-10"></div>}
                        </div>
                        
                        <h1 className="text-xl font-bold text-white absolute left-1/2 transform -translate-x-1/2">
                            {location.pathname === '/' ? 'My Games' : 'MMOP'}
                        </h1>
                        
                        <div className="flex items-center space-x-4 w-30 justify-end">
                            <div className="relative">
                                <button 
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white relative"
                                    onClick={() => setNotificationsToggled(!notificationsToggled)}
                                >
                                    <FiBell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>
                                
                                {notificationsToggled && (
                                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="text-xs text-purple-400 font-medium">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div 
                                                        key={notification.id}
                                                        className={`px-4 py-3 hover:bg-gray-700 transition-colors duration-200 border-b border-gray-700/50 ${
                                                            notification.unread ? 'bg-purple-900/10' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-1">
                                                            <h4 className="text-sm font-medium text-white flex items-center">
                                                                {notification.title}
                                                                {notification.unread && (
                                                                    <span className="ml-2 w-2 h-2 bg-purple-500 rounded-full"></span>
                                                                )}
                                                            </h4>
                                                        </div>
                                                        <p className="text-sm text-gray-400 mb-3">{notification.message}</p>
                                                        
                                                        {notification.type === 'request' && (
                                                            <div className="flex items-center space-x-2">
                                                                <button 
                                                                    onClick={() => handleRequest(notification, true)}
                                                                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors duration-200"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRequest(notification, false)}
                                                                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors duration-200"
                                                                >
                                                                    Deny
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="px-4 py-2 border-t border-gray-700 bg-gray-900/50">
                                            <button className="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200" onClick={handleRead}>
                                                Mark all as read
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="relative">
                                <button 
                                    className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-200 flex items-center justify-center text-white font-bold shadow-lg"
                                    onClick={() => setDropdownToggled(!dropdownToggled)}
                                >
                                    {username.charAt(0).toUpperCase() || 'U'}
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
                    </div>
                </header>
            )}


            {/* Sidebar and overlay */}
            {menuToggled && showSidebar && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-30"
                        onClick={() => setMenuToggled(false)}
                    />
                    {/* Sidebar */}
                    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 z-40 shadow-xl border-r border-gray-800 flex flex-col animate-slide-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                            <span className="text-lg font-bold text-white">MMOP</span>
                            <button
                                className="p-2 hover:bg-gray-700 rounded-lg text-white"
                                onClick={() => setMenuToggled(false)}
                            >
                                <BsX size={24} />
                            </button>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {sidebarLinks.map(link => (
                                <button
                                    key={link.path}
                                    className={`w-full text-left px-4 py-2 rounded-lg text-gray-300 hover:bg-purple-700/30 hover:text-white transition-colors duration-200 font-medium ${location.pathname === link.path ? 'bg-purple-700/20 text-white' : ''}`}
                                    onClick={() => {
                                        navigate(link.path);
                                        setMenuToggled(false);
                                    }}
                                >
                                    {link.name}
                                </button>
                            ))}
                        </nav>
                        <div className="px-6 py-4 border-t border-gray-800">
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                                onClick={handleLogout}
                            >
                                Sign out
                            </button>
                        </div>
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className={showNavbar ? 'ml-0' : 'min-h-screen'}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
