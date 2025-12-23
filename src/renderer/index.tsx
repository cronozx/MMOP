import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Login from './screens/Login';
import { HashRouter, Navigate, Route, Routes, Outlet } from 'react-router';
import Register from './screens/Register';
import Home from './screens/Home';
import GameDetail from './screens/GameDetail';
import Modpacks from './screens/Modpacks';
import Modpack from './screens/Modpack';

const root = createRoot(document.getElementById('root')!);

const PrivateRoute: React.FC = () => {
    const [isAuthenticated, setAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await window.db.getAuthToken();
                const isValid = await window.db.validateAuthToken(token || '');
                setAuthenticated(isValid);
            } catch (error) {
                setAuthenticated(false);
            }
        };
        
        checkAuth();
    }, [])
    
    if (isAuthenticated === null) {
        return <div className="flex items-center justify-center h-screen bg-gray-900">
            <p className="text-white">Loading...</p>
        </div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to='/login' />;
}

root.render(
    <HashRouter>
        <Routes>
            <Route element={ <PrivateRoute/>}>
                <Route path='/' element={<Home/>} />
                <Route path='/game' element={<GameDetail/>} />
                <Route path='/modpacks' element={<Modpacks/>} />
                <Route path='/modpack' element={<Modpack/>} />
            </Route>
            <Route path='/login' element={<Login />} /> 
            <Route path="/register" element={<Register />} />
        </Routes>
    </HashRouter>
)