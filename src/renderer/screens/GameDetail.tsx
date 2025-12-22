import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import Layout from "../components/Layout";
import { useDropzone } from "react-dropzone";
import { FiPackage, FiUpload, FiX, FiArrowLeft } from "react-icons/fi";

interface GameConfig {
    id: number;
    name: string;
    acceptedTypes: Record<string, string[]>;
    extensions: string;
    description: string;
}

interface ModFile {
    name: string;
    size: number;
    path?: string;
    type: string;
}

interface Game {
    id: number;
    title: string;
    image: string;
    modCount: number;
}

const GameDetail: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const game = location.state?.game as Game | undefined;

    const [selectedOption, setSelectedOption] = useState<'modpack' | 'upload' | null>(null);
    const [modpackName, setModpackName] = useState<string>("");
    const [modpackDescription, setModpackDescription] = useState<string>("");
    const [modpackMods, setModpackMods] = useState<ModFile[]>([]);
    const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const acceptConfig = gameConfig?.acceptedTypes || {};

    const uploadDropzone = useDropzone({
        onDrop: async (acceptedFiles: File[]) => {
            console.log("Uploading mod files:", acceptedFiles);
            console.log("For game:", gameConfig?.name);
            
            for (const file of acceptedFiles) {
                try {
                    const token = await window.db.getAuthToken();
                    if (!token) {
                        console.error('No authentication token found');
                        continue;
                    }
                    const username = await window.db.getUsername() || 'Unknown';
                    
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Array.from(new Uint8Array(arrayBuffer));
                    
                    await window.db.uploadMod(token, {
                        name: file.name,
                        author: username,
                        game: gameConfig!.id,
                        file: {
                            name: file.name,
                            buffer: buffer,
                            size: file.size,
                            type: file.type
                        }
                    });
                    console.log(`Successfully uploaded ${file.name}`);
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                }
            }
        },
        accept: acceptConfig
    });

    useEffect(() => {
        const fetchGameConfig = async () => {
            if (!game) {
                navigate('/');
                return;
            }
    
            try {
                const token = await window.db.getAuthToken();
                if (!token) {
                    navigate('/login');
                    return;
                }
    
                const games = await window.db.getAllGames(token);
                const foundGame = games.find((g: any) => g.id === game.id);
                
                if (foundGame) {
                    setGameConfig({
                        id: foundGame.id,
                        name: foundGame.name,
                        acceptedTypes: foundGame.acceptedTypes as Record<string, string[]> || {},
                        extensions: foundGame.extensions,
                        description: foundGame.description
                    });
                }
            } catch (error) {
                console.error('Error fetching game config:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchGameConfig();
    }, [game, navigate]);

    if (!game) {
        return null;
    }

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen p-8 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                    <div className="max-w-6xl mx-auto text-center py-16">
                        <p className="text-gray-400 text-lg">Loading game configuration...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!gameConfig) {
        return (
            <Layout>
                <div className="min-h-screen p-8 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                    <div className="max-w-6xl mx-auto">
                        <button 
                            onClick={() => navigate('/')}
                            className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <FiArrowLeft />
                            <span>Back to Games</span>
                        </button>
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">Game configuration not found.</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    const handleCreateModpack = (): void => {
        //Will add modpack handling
    };

    const resetForm = (): void => {
        setSelectedOption(null);
        setModpackName("");
        setModpackDescription("");
        setModpackMods([]);
    };

    return (
        <Layout>
            <div className="min-h-screen p-8 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="max-w-6xl mx-auto">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <FiArrowLeft />
                        <span>Back to Games</span>
                    </button>

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">{game.title}</h1>
                        <p className="text-gray-400">Create content for {game.title}</p>
                        <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-600/20 rounded-lg">
                            <span className="text-blue-400 text-sm font-medium">
                                Accepts {gameConfig.extensions} files
                            </span>
                        </div>
                    </div>

                    {!selectedOption ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Create Modpack Card */}
                            <div 
                                onClick={() => setSelectedOption('modpack')}
                                className="group relative bg-linear-to-br from-purple-900/30 to-purple-600/20 border-2 border-purple-500/30 rounded-2xl p-8 cursor-pointer hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-linear-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors duration-300">
                                        <FiPackage className="text-purple-400 text-3xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3">Create Modpack</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        Bundle multiple mods together into a single modpack for {game.title}.
                                    </p>
                                </div>
                            </div>

                            {/* Upload Mod Card */}
                            <div 
                                onClick={() => setSelectedOption('upload')}
                                className="group relative bg-linear-to-br from-blue-900/30 to-blue-600/20 border-2 border-blue-500/30 rounded-2xl p-8 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors duration-300">
                                        <FiUpload className="text-blue-400 text-3xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3">Upload Mod</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        Upload individual {gameConfig.extensions} mod files to your {game.title} library.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : selectedOption === 'modpack' ? (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Create {game.title} Modpack</h2>
                                <button 
                                    onClick={resetForm}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Modpack Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Modpack Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={modpackName}
                                        onChange={(e) => setModpackName(e.target.value)}
                                        placeholder="My Awesome Modpack"
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    />
                                </div>

                                {/* Modpack Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={modpackDescription}
                                        onChange={(e) => setModpackDescription(e.target.value)}
                                        placeholder="Describe your modpack..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                                    />
                                </div>

                                {/* Create Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleCreateModpack}
                                        disabled={!modpackName || modpackMods.length === 0}
                                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                                    >
                                        Create Modpack
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Upload {game.title} Mod</h2>
                                <button 
                                    onClick={resetForm}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            {(() => {
                                return (
                                    <div 
                                        {...uploadDropzone.getRootProps()} 
                                        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                                            uploadDropzone.isDragActive 
                                                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                                                : 'border-gray-600 hover:border-blue-500/50 bg-gray-900/30 hover:bg-gray-900/50'
                                        }`}
                                    >
                                        <input {...uploadDropzone.getInputProps()} />
                                        <FiUpload className={`text-6xl mx-auto mb-4 transition-colors ${
                                            uploadDropzone.isDragActive ? 'text-blue-400' : 'text-gray-500'
                                        }`} />
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {uploadDropzone.isDragActive ? "Drop your mod files here" : `Upload Your ${gameConfig.name} Mod`}
                                        </h3>
                                        <p className="text-gray-400 mb-4">
                                            Click to browse or drag and drop your mod files
                                        </p>
                                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600/20 rounded-lg">
                                            <span className="text-blue-400 text-sm font-medium">
                                                Supports {gameConfig.extensions} files
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default GameDetail;
