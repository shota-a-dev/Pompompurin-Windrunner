/**
 * コレクションアイテムのマスターデータ
 */
export interface CollectionItem {
    id: string;
    name: string;
    cost: number;
    description: string;
    image: string;
}

export const CollectionConfig: CollectionItem[] = [
    {
        id: '001',
        name: 'マフィンのぬいぐるみ',
        cost: 1, // テスト用 (本来は100)
        description: 'とってもやわらかいマフィンのぬいぐるみ。',
        image: 'assets/image/collection/item_001.png'
    },
    {
        id: '002',
        name: '特大プリン',
        cost: 200,
        description: 'みんなで食べられる特大サイズのプリン！',
        image: 'assets/image/collection/item_002.png'
    },
    {
        id: '003',
        name: 'チームプリンの帽子',
        cost: 500,
        description: 'これをかぶれば君もチームプリンの一員だ。',
        image: 'assets/image/collection/item_003.png'
    },
    {
        id: '004',
        name: 'ひみつのメモ帳',
        cost: 1000,
        description: 'プリンの好きな言葉が書いてあるかも？',
        image: 'assets/image/collection/item_004.png'
    }
];
