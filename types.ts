export type Platform = 'pc' | 'ps4' | 'xbox' | 'switch' | 'mobile';

export interface MarketItem {
  name: string;
  urlName: string;
  lowestPrice: number | null;
  avgPrice: number | null;
  soldCount: number | null;
  error?: string;
}

// From Warframe Market API /orders endpoint
export interface WarframeMarketOrder {
    platinum: number;
    quantity: number;
    order_type: 'sell' | 'buy';
    user: {
        status: 'ingame' | 'online' | 'offline';
    };
    visible: boolean;
}

export interface WarframeMarketOrdersResponse {
    payload: {
        orders: WarframeMarketOrder[];
    };
}

// From Warframe Market API /statistics/closed endpoint
export interface WarframeMarketStatistic {
    datetime: string;
    volume: number;
    min_price: number;
    max_price: number;
    avg_price: number;
    wa_price: number;
    median: number;
    order_type: 'buy' | 'sell';
    id: string;
}

export interface WarframeMarketStatisticsResponse {
    payload: {
        statistics_closed: {
            '48hours': WarframeMarketStatistic[];
            '90days': WarframeMarketStatistic[];
        };
    };
}

// From Warframe Market API /items endpoint
export interface WarframeMarketItemShort {
    item_name: string;
    url_name: string;
}

export interface WarframeMarketItemsResponse {
    payload: {
        items: WarframeMarketItemShort[];
    };
}
