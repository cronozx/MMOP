import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../components/Layout';

const Login: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [invalid, setInvalid] = useState<boolean | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !password) {
            setInvalid(true)
            return;
        }

        const valid = await window.db.validateUser(username, password)

        if (!valid) {
            setInvalid(true)
            return;
        }
        
        navigate('/')
    };

    return (
        <Layout showNavbar={false} showSidebar={false}>
            <div className='justify-center items-center flex flex-col h-screen'>
            <h1 className='text-white text-center text-5xl font-bold mb-8'>Login</h1>
            <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0 cursor-pointer'
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0 cursor-pointer'
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className='px-6 py-3 text-lg font-semibold bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer'>Login</button>
                <button type="button" onClick={() => { navigate('/register')}} className='px-6 py-3 text-lg font-semibold bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer'>Register</button>
                {invalid && <p className='text-center text-red-600'>Invalid username or password</p>}
            </form>
        </div>
        </Layout>
    );
};

export default Login;