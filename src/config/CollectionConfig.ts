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
        cost: 10, 
        description: 'とってもやわらかいマフィンのぬいぐるみ。ずっと触っていたい心地よさ。',
        image: 'assets/image/collection/item_001.png'
    },
    {
        id: '002',
        name: 'ゴールデン・ベレー帽',
        cost: 50, 
        description: 'キラキラ輝く特別なベレー帽。プリンの一番のお気に入り。',
        image: 'assets/image/collection/item_002.png'
    },
    {
        id: '003',
        name: 'ほかほかミルク瓶',
        cost: 100, 
        description: '牛さん模様の瓶に入った温かいミルク。飲むと心までポカポカに。',
        image: 'assets/image/collection/item_003.png'
    },
    {
        id: '004',
        name: 'キャラメルソースの噴水',
        cost: 150,
        description: '黄金色のキャラメルソースが溢れ出す、夢のような噴水。',
        image: 'assets/image/collection/item_004.png'
    },
    {
        id: '005',
        name: '特大マカロン（イエロー）',
        cost: 200, 
        description: 'カスタードクリームがたっぷり詰まった、とっても大きなマカロン。',
        image: 'assets/image/collection/item_005.png'
    },
    {
        id: '006',
        name: '友情のなかよしバッジ',
        cost: 300, 
        description: 'プリンとお友達の顔が描かれた、絆の証のハート型バッジ。',
        image: 'assets/image/collection/item_006.png'
    },
    {
        id: '007',
        name: '幸運の四つ葉のクローバー',
        cost: 400, 
        description: '不思議な粉でキラキラ光るクローバー。持っていると良いことがあるかも？',
        image: 'assets/image/collection/item_007.png'
    },
    {
        id: '008',
        name: '虹色のプリン',
        cost: 500, 
        description: '七色に輝く伝説のプリン。プルプル揺れる姿はまるで魔法のよう。',
        image: 'assets/image/collection/item_008.png'
    }
];
