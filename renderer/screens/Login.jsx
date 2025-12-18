import React, { useState } from 'react';
import { redirect, useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [invalid, setInvalid] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setInvalid(true)
            return;
        }

        if (!(await window.db.validateUser(username, password))) {
            setInvalid(true)
            return;
        }

        navigate('/home')
    };

    return (
        <div className='justify-center items-center flex flex-col bg-gray-700 h-screen'>
            <h1 className='text-white text-center text-5xl font-bold mb-8'>Login</h1>
            <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className='px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded hover:bg-blue-700'>Login</button>
                <button type="button" onClick={(e) => { navigate('/register')}} className='px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded hover:bg-blue-700'>Register</button>
                {invalid && <p className='text-center text-red-600'>Invalid username or password</p>}
            </form>
        </div>
    );
};

export default Login;