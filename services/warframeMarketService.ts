import { 
    MarketItem, 
    WarframeMarketOrdersResponse, 
    WarframeMarketStatisticsResponse, 
    Platform,
    WarframeMarketItemsResponse,
    WarframeMarketItemShort
} from '../types';

// We are using a public CORS proxy to bypass browser restrictions.
// The proxy forwards the request to the official Warframe Market API.
const API_BASE_URL = 'https://corsproxy.io/?https://api.warframe.market/v1';
const CACHE_KEY = 'warframe_market_items';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedItems {
    timestamp: number;
    items: WarframeMarketItemShort[];
}

export const fetchAllItems = async (): Promise<WarframeMarketItemShort[]> => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, items }: CachedItems = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                console.log("Loaded all items from cache.");
                return items;
            }
        }
    } catch (error) {
        console.warn("Could not read from cache:", error);
    }
    
    try {
        console.log("Fetching all items from API...");
        const response = await fetch(`${API_BASE_URL}/items`);
        if (!response.ok) {
            throw new Error(`Failed to fetch items list: ${response.status} ${response.statusText}`);
        }
        const data: WarframeMarketItemsResponse = await response.json();
        const items = data.payload.items;

        try {
            const cachePayload: CachedItems = { timestamp: Date.now(), items };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
            console.log("Saved all items to cache.");
        } catch (error) {
            console.warn("Could not save to cache:", error);
        }

        return items;
    } catch (error) {
        console.error("Error fetching all item names:", error);
        return [];
    }
};

export const fetchItemPrices = async (
    items: WarframeMarketItemShort[],
    platform: Platform,
    onItemProcessed: (item: MarketItem) => void
): Promise<void> => {
    const pricePromises = items.map(async (itemInfo) => {
        const { item_name: name, url_name: urlName } = itemInfo;
        const itemData: MarketItem = { name, urlName, lowestPrice: null, avgPrice: null, soldCount: null };
        const headers = { 'Platform': platform, 'Language': 'en' };

        try {
            // Fetch both orders and statistics concurrently for efficiency
            const [ordersResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/items/${urlName}/orders`, { headers }),
                fetch(`${API_BASE_URL}/items/${urlName}/statistics`, { headers })
            ]);

            // Process Orders for the current lowest price
            if (ordersResponse.ok) {
                const ordersData: WarframeMarketOrdersResponse = await ordersResponse.json();
                const onlineSellOrders = ordersData.payload.orders.filter(
                    (order) => 
                        order.order_type === 'sell' &&
                        order.visible &&
                        (order.user.status === 'ingame' || order.user.status === 'online')
                );

                if (onlineSellOrders.length > 0) {
                    onlineSellOrders.sort((a, b) => a.platinum - b.platinum);
                    itemData.lowestPrice = onlineSellOrders[0].platinum;
                }
            } else if (ordersResponse.status !== 404) {
                 console.warn(`Could not fetch orders for ${name}: ${ordersResponse.status} ${ordersResponse.statusText}`);
            }

            // Process Statistics for historical average and volume
            if (statsResponse.ok) {
                const statsData: WarframeMarketStatisticsResponse = await statsResponse.json();
                const last48hStats = statsData.payload.statistics_closed['48hours'];
                if (last48hStats.length > 0) {
                    const totalSoldCount = last48hStats.reduce((acc, stat) => acc + stat.volume, 0);
                    itemData.soldCount = totalSoldCount;

                    // Calculate a volume-weighted average price for a more accurate representation
                    if (totalSoldCount > 0) {
                        const totalPlatinum = last48hStats.reduce((acc, stat) => acc + (stat.avg_price * stat.volume), 0);
                        itemData.avgPrice = Math.round(totalPlatinum / totalSoldCount);
                    } else {
                        // Fallback to the latest average if volume is 0 (rare case)
                         const relevantStat = last48hStats[last48hStats.length - 1];
                         itemData.avgPrice = Math.round(relevantStat.avg_price);
                    }
                }
            } else if (statsResponse.status !== 404) {
                console.warn(`Could not fetch statistics for ${name}: ${statsResponse.status} ${statsResponse.statusText}`);
            }
            
            onItemProcessed(itemData);

        } catch (error) {
            console.error(`Error fetching price data for ${name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
            onItemProcessed({ ...itemData, error: errorMessage });
        }
    });

    await Promise.allSettled(pricePromises);
};