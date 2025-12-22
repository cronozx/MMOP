import React from "react";
import { useNavigate } from "react-router";

interface GameComponentProps {
    id: number;
    image: string;
    title: string;
    modCount: number;
}

const GameComponent: React.FC<GameComponentProps> = ({ id, image, title, modCount }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/game', { state: { game: { id, title, image, modCount } } });
    };

    return (
        <div 
            onClick={handleClick}
            className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl aspect-square"
        >
            <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-100 group-hover:opacity-95 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white text-lg font-bold mb-1.5 line-clamp-1">
                        {title}
                    </h3>
                    <p className="text-gray-300 text-sm font-medium">
                        {modCount.toLocaleString()} {modCount === 1 ? 'mod' : 'mods'}
                    </p>
                </div>
            </div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-xs font-semibold">View Mods</span>
            </div>
        </div>
    );
};

export default GameComponent;
