import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Login from './screens/Login';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Register from './screens/Register';

const root = createRoot(document.getElementById('root'));

root.render(
    <HashRouter>
        <Routes>
            <Route path='/' element={<Navigate to='/login' />} />
            <Route path='/login' element={<Login />} /> 
            <Route path="/register" element={<Register />} />
        </Routes>
    </HashRouter>
)