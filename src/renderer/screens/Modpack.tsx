import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Layout from "../components/Layout";
import { FiPackage, FiArrowLeft, FiUser, FiFileText, FiPlus, FiX, FiCheck, FiUserPlus } from "react-icons/fi";
import { ModpackType, ModType, UserData } from "../../types/sharedTypes";

const Modpack: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [modpack, setModpack] = useState<ModpackType | undefined>(location.state?.modpack as ModpackType | undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [availableMods, setAvailableMods] = useState<ModType[]>([]);
    const [currentMods, setCurrentMods] = useState<string[]>([]);
    const [showAddModsModal, setShowAddModsModal] = useState<boolean>(false);
    const [showAddContributorsModal, setShowAddContributorsModal] = useState<boolean>(false);
    const [registeredUsers, setRegisteredUsers] = useState<UserData[]>([]);
    const [contributersInModpack, setContributorsInModpack] = useState<UserData[]>([]);
    const [pendingContributers, setPendingContributers] = useState<UserData[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [saving, setSaving] = useState<boolean>(false);
    const [isContributor, setIsContributor] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);

    useEffect(() => {
        const fetchMods = async () => {
            if (!modpack) {
                navigate('/modpacks');
                return;
            }

            try {
                const token = await window.db.getAuthToken();
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                //Grabs mods from db and sets useState
                const mods = await window.db.getAllModsForGame(token, modpack.gameID);
                setAvailableMods(mods);
                setCurrentMods([...modpack.mods]);
            } catch (error) {
                console.error('Error fetching mods:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMods();
    }, [modpack, navigate]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = await window.db.getAuthToken();
                if (!token) {
                    navigate('/login');
                    return;
                }

                //Grabs users from db and sets useState
                const users = await window.db.getAllUsers(token);
                if (!users) {
                    return;
                }
                if (!modpack?.contributers) {
                    return;
                }

                const currUserData = await window.db.getUserDataFromToken();
                const currUser_Id = currUserData?._id;

                if (!currUser_Id) {
                    throw new Error('Could not get current user id')
                }

                setIsAuthor(currUserData?.username === modpack.author);
                setIsContributor(!!modpack.contributers[currUser_Id]);

                const confirmedContributers: UserData[] = users.filter(
                    user => modpack.contributers && modpack.contributers[user._id]
                );

                const pendingContributers: UserData[] = users.filter(
                    user => modpack.contributers && modpack.contributers[user._id] === false
                );

                setContributorsInModpack(confirmedContributers);
                setPendingContributers(pendingContributers);
                setRegisteredUsers(
                    users.filter(
                        user => user._id && !confirmedContributers.some(contrib => contrib._id === user._id) && !(user._id === currUser_Id)
                    )
                );
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers()
    }, [modpack, navigate])

    const handleAddMod = (modId: string) => {
        if (!currentMods.includes(modId)) {
            setCurrentMods([...currentMods, modId]);
        }
    };

    const handleRemoveMod = (modId: string) => {
        setCurrentMods(currentMods.filter(_id => _id !== modId));
    };

    const handleAddUser = async (user: UserData) => {
        const token = await window.db.getAuthToken();

        if (!token || !user._id) {
            return;
        }

        if (!contributersInModpack.includes(user)) {
            setRegisteredUsers([...registeredUsers.filter(regUser => regUser !== user)])
            setPendingContributers([...pendingContributers, user])
        }
    }

    const handleRemoveUser = (user: UserData) => {
        if (contributersInModpack.includes(user)) {
            setContributorsInModpack(contributersInModpack.filter(currUser => currUser._id !== user._id));
        } else if (pendingContributers.includes(user)) {
            setPendingContributers(pendingContributers.filter(currUser => currUser._id !== user._id));
        }

        setRegisteredUsers([...registeredUsers, user]);
    }

    const handleSave = async () => {
        if (!modpack) return;

        setSaving(true);

        try {
            if (isAuthor) {
                const token = await window.db.getAuthToken();
                if (!token) {
                    navigate('/login');
                    return;
                }

                const allContributers = [...contributersInModpack, ...pendingContributers];
                const contributersPairs: { [userId: string]: boolean } = {};
                allContributers.forEach(user => {
                    if (user._id) {
                        if (contributersInModpack.includes(user)) {
                            contributersPairs[user._id] = true;
                        } else {
                            contributersPairs[user._id] = false;
                        }
                    } 
                });

                const updatedModpack: ModpackType = {
                    ...modpack,
                    contributers: contributersPairs,
                    mods: currentMods
                };
                
                const success = await window.db.updateModpack(token, updatedModpack);
                
                if (success) {
                    console.log('Modpack updated successfully');
                    setModpack(updatedModpack)

                    const currUserData = await window.db.getUserDataFromToken()
                    const currUsername = currUserData?.username;

                    pendingContributers.forEach(async (user) => { 
                        if (!user._id) {
                            return;
                        }

                        window.db.sendNotification(token, user._id, {
                            id: await window.db.randUUID(),
                            type: 'request',
                            title: 'Contribution Request',
                            message: `${currUsername} would like you to join their modpack ${modpack?.name}`,
                            unread: true,
                            modpack_Id: modpack._id
                        })
                    });

                    setShowAddModsModal(false);
                } else {
                    console.error('Failed to update modpack');
                }
            } else if (isContributor) {
                //Logic will be added next commit :D im so tired
            }
        } catch (error) {
            console.error('Error saving modpack:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!modpack) {
        return null;
    }

    const currentModObjects = availableMods.filter(mod => mod._id && currentMods.includes(mod._id));

    let filteredAvailableMods: ModType[] = [];
    let filteredUsers: UserData[] = [];

    if (showAddModsModal) {
        filteredAvailableMods = availableMods.filter(mod => mod._id && !currentMods.includes(mod._id) && mod.name.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (showAddContributorsModal) {
        filteredUsers = registeredUsers.filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    const allContribIds = [...contributersInModpack, ...pendingContributers].map(u => u._id).filter(Boolean).sort();
    const modpackContribIds = Object.keys(modpack.contributers || {}).sort();
    const hasChanges = JSON.stringify(currentMods) !== JSON.stringify(modpack.mods) || JSON.stringify(allContribIds) !== JSON.stringify(modpackContribIds);

    if (loading) {
        return (
            <Layout>
                <div className="p-8">
                    <div className="max-w-6xl mx-auto text-center py-16">
                        <p className="text-gray-400 text-lg">Loading modpack...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen p-8 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="max-w-6xl mx-auto">
                    <button 
                        onClick={() => navigate('/modpacks')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <FiArrowLeft />
                        <span>Back to Modpacks</span>
                    </button>

                    {/* Modpack Header */}
                    <div className="bg-linear-to-br from-purple-900/30 to-purple-600/20 border border-purple-500/30 rounded-2xl p-8 mb-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-purple-600/30 rounded-xl flex items-center justify-center">
                                    <FiPackage className="text-purple-400 text-3xl" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{modpack.name}</h1>
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <FiUser className="text-sm" />
                                        <span className="text-sm">by {modpack.author}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 rounded-lg">
                                <FiFileText className="text-purple-400" />
                                <span className="text-purple-400 font-medium">
                                    {currentMods.length} {currentMods.length === 1 ? 'mod' : 'mods'}
                                </span>
                            </div>
                        </div>
                        
                        {modpack.description && (
                            <p className="text-gray-300 leading-relaxed">{modpack.description}</p>
                        )}

                        {(contributersInModpack.length > 0 || pendingContributers.length > 0) && (
                            <div className="mt-4 pt-4 border-t border-purple-500/30">
                                <span className="text-gray-400 text-sm font-medium mb-2 block">Contributors:</span>
                                <div className="flex flex-wrap gap-2">
                                    {contributersInModpack.map(user => (
                                        <div key={user._id} className="flex items-center bg-purple-900/20 px-3 py-1 rounded-lg text-white text-sm">
                                            <span>{user.username}</span>
                                            {isAuthor && (
                                                <button
                                                    className="ml-2 text-gray-400 hover:text-red-400"
                                                    title="Remove contributor"
                                                    onClick={() => handleRemoveUser(user)}
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {pendingContributers.map(user => (
                                        <div key={user._id} className="flex items-center bg-yellow-900/20 px-3 py-1 rounded-lg text-yellow-200 text-sm border border-yellow-400/40">
                                            <span>{user.username} <span className="italic text-yellow-400">(pending)</span></span>
                                            {isAuthor && (
                                                <button
                                                    className="ml-2 text-gray-400 hover:text-red-400"
                                                    title="Remove pending contributor"
                                                    onClick={() => handleRemoveUser(user)}
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Mods in this Pack</h2>
                        <div className="flex items-center space-x-3">
                            {hasChanges && (
                                isAuthor ? (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                    >
                                        <FiCheck />
                                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                    >
                                        <FiCheck />
                                        <span>{saving ? 'Request Save' : 'Request Save'}</span>
                                    </button>
                                )
                            )}
                            {isAuthor && (
                                <>
                                    <button
                                        onClick={() => setShowAddContributorsModal(true)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <FiUserPlus />
                                        <span>Add Contributors</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowAddModsModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                            >
                                <FiPlus />
                                <span>Add Mods</span>
                            </button>
                        </div>
                    </div>

                    {/* Current Mods List */}
                    {currentModObjects.length === 0 ? (
                        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-12 text-center mb-8">
                            <FiPackage className="text-gray-600 text-5xl mx-auto mb-4" />
                            <p className="text-gray-400 text-lg mb-2">No mods in this modpack yet</p>
                            <p className="text-gray-500 text-sm">Click "Add Mods" to start building your collection</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {currentModObjects.map((mod) => (
                                <div 
                                    key={mod._id}
                                    className="group bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-white font-semibold mb-1">{mod.name}</h3>
                                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                                <FiUser className="text-xs" />
                                                <span>{mod.author}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => mod._id && handleRemoveMod(mod._id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Remove mod"
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Mods Modal */}
                    {showAddModsModal && (
                        <>
                            <div 
                                className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
                                onClick={() => setShowAddModsModal(false)}
                            />
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                        <h3 className="text-2xl font-bold text-white">Add Mods to Pack</h3>
                                        <button
                                            onClick={() => setShowAddModsModal(false)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <FiX size={24} />
                                        </button>
                                    </div>

                                    <div className="p-6 border-b border-gray-700">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search mods..."
                                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {filteredAvailableMods.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-gray-400">
                                                    {searchQuery ? 'No mods match your search' : 'All available mods are already in this pack'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredAvailableMods.map((mod) => (
                                                    <div 
                                                        key={mod._id}
                                                        className="group bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="text-white font-semibold mb-1">{mod.name}</h4>
                                                                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                                                    <FiUser className="text-xs" />
                                                                    <span>{mod.author}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => mod._id && handleAddMod(mod._id)}
                                                                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                                                            >
                                                                <FiPlus size={16} />
                                                                <span>Add</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {hasChanges && (
                                        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                            >
                                                <FiCheck />
                                                <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Shows Add Contributors Modal */}
                    {showAddContributorsModal && (
                        <>
                            <div 
                                className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
                                onClick={() => setShowAddContributorsModal(false)}
                            />
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                        <h3 className="text-2xl font-bold text-white">Add Contributors to Pack</h3>
                                        <button
                                            onClick={() => setShowAddContributorsModal(false)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <FiX size={24} />
                                        </button>
                                    </div>

                                    <div className="p-6 border-b border-gray-700">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search people..."
                                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {filteredUsers.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-gray-400">
                                                    {searchQuery ? 'No users match your search' : 'Start searching for users'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredUsers.map((user) => (
                                                    <div 
                                                        key={user._id}
                                                        className="group bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 text-white">
                                                                    <FiUser className="text-s"/>
                                                                    <h4 className="text-white font-semibold">{user.username}</h4>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => user && handleAddUser(user)}
                                                                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                                                                type="button"
                                                            >
                                                                <FiPlus size={16} />
                                                                <span>Add</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </Layout>
    );
};

export default Modpack;