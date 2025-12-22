import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../components/Layout';

const Register: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!username || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            await window.db.addUser(username, email, password);
            navigate('/');
        } catch (err: any) {
            setError('Registration failed. Username or email may already exist.');
        }
    };

    return (
        <Layout showNavbar={false} showSidebar={false}>
            <div className='justify-center items-center flex flex-col h-screen'>
            <h1 className='text-white text-center text-5xl font-bold mb-8'>Register</h1>
            <form onSubmit={handleRegister} className='flex flex-col gap-4'>
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    className='text-center border-black border rounded-sm px-6 py-3 text-lg outline-0'
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="submit" className='px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded hover:bg-blue-700'>Register</button>
                <button type="button" onClick={() => navigate('/')} className='px-6 py-3 text-lg font-semibold bg-gray-600 text-white rounded hover:bg-gray-700'>Back to Login</button>
                {error && <p className='text-center text-red-600'>{error}</p>}
            </form>
        </div>
        </Layout>
    );
};

export default Register;