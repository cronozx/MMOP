import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { FiPackage, FiUser, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router";
import { ModpackType } from "../../types/sharedTypes";

const Modpacks: React.FC = () => {
    const [modpacks, setModpacks] = useState<ModpackType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchModpacks = async () => {
            try {
                const token = await window.db.getAuthToken();
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const fetchedModpacks = await window.db.getAllModpacks(token);
                setModpacks(fetchedModpacks);
            } catch (error) {
                console.error('Error fetching modpacks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchModpacks();
    }, [navigate]);

    if (loading) {
        return (
            <Layout>
                <div className="p-8">
                    <div className="max-w-7xl mx-auto text-center py-16">
                        <p className="text-gray-400 text-lg">Loading modpacks...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">My Modpacks</h2>
                        <p className="text-gray-400">Browse and manage your modpack collections</p>
                    </div>

                    {modpacks.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/50 rounded-full flex items-center justify-center">
                                <FiPackage className="text-gray-600 text-5xl" />
                            </div>
                            <p className="text-gray-400 text-lg mb-2">No modpacks yet</p>
                            <p className="text-gray-500 text-sm">Create a modpack from the game detail page to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modpacks.map((modpack, index) => (
                                <div 
                                    key={index}
                                    onClick={() => navigate('/modpack', { state: { modpack } })}
                                    className="group bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                                            <FiPackage className="text-purple-400 text-2xl" />
                                        </div>
                                        <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700/50 rounded-lg">
                                            <FiFileText className="text-gray-400 text-sm" />
                                            <span className="text-gray-400 text-sm font-medium">
                                                {modpack.mods?.length || 0} {modpack.mods?.length === 1 ? 'mod' : 'mods'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                        {modpack.name}
                                    </h3>

                                    {modpack.description && (
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                            {modpack.description}
                                        </p>
                                    )}

                                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-700">
                                        <FiUser className="text-gray-500 text-sm" />
                                        <span className="text-gray-500 text-sm">by {modpack.author}</span>
                                    </div>

                                    {(modpack.contributers?.length || 0) > 0 && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <span className="text-gray-600 text-xs">
                                                +{modpack.contributers?.length || 0} {modpack.contributers?.length === 1 ? 'contributor' : 'contributors'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Modpacks;
