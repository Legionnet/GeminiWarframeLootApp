import React, { useState, useEffect, useRef } from 'react';

interface ItemSearchProps {
    onSearch: (itemName: string) => void;
    isProcessing: boolean;
    allItems: string[];
}

const ItemSearch: React.FC<ItemSearchProps> = ({ onSearch, isProcessing, allItems }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !isProcessing) {
            onSearch(query.trim());
            setShowSuggestions(false);
        }
    };

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setActiveIndex(-1); 

        if (value.length > 1) {
            const filteredSuggestions = allItems
                .filter(item => item.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 7);
            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        onSearch(suggestion);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
            } else if (e.key === 'Enter') {
                if (activeIndex > -1) {
                    e.preventDefault();
                    handleSuggestionClick(suggestions[activeIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    return (
        <div ref={searchContainerRef} className="w-full max-w-xl mx-auto bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Search for an Item Manually</h3>
            <form onSubmit={handleSearchSubmit} className="w-full flex gap-2">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Vasto Prime Barrel"
                        disabled={isProcessing}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50"
                        aria-label="Search for a Warframe item"
                        autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-gray-900 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={suggestion}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseOver={() => setActiveIndex(index)}
                                    className={`px-4 py-2 cursor-pointer text-gray-300 hover:bg-gray-700 ${
                                        index === activeIndex ? 'bg-cyan-800' : ''
                                    }`}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isProcessing || !query.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Search
                </button>
            </form>
        </div>
    );
};

export default ItemSearch;
