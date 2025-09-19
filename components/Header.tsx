import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center p-4 md:p-6">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
                Warframe Market Scanner
            </h1>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                Upload a screenshot of your relic rewards. We'll use AI to read the items and fetch their average price from warframe.market.
            </p>
        </header>
    );
};

export default Header;
