import React from "react";
import GameComponent from "../components/GameComponent";
import Layout from "../components/Layout";

const Home = () => {
    const games = [
        { id: 1, image: "../public/minecraft.png", title: "Minecraft", modCount: 42 }
    ]

    return (
        <Layout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Browse Games</h2>
                        <p className="text-gray-400">Manage mods for your favorite games</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <GameComponent 
                                key={game.id}
                                image={game.image} 
                                title={game.title} 
                                modCount={game.modCount} 
                            />
                        ))}
                    </div>

                    {games.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">No games found. Add a game to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Home;