import { db } from '@/db';
import { sectionItems } from '@/db/schema';

async function main() {
    const sampleSectionItems = [
        // Section 5 (Editor's Picks - playlist_carousel): 4-5 playlists
        {
            sectionId: 5,
            itemType: 'playlist',
            itemId: 1,
            position: 1,
            createdAt: new Date('2024-01-10'),
        },
        {
            sectionId: 5,
            itemType: 'playlist',
            itemId: 2,
            position: 2,
            createdAt: new Date('2024-01-10'),
        },
        {
            sectionId: 5,
            itemType: 'playlist',
            itemId: 3,
            position: 3,
            createdAt: new Date('2024-01-10'),
        },
        {
            sectionId: 5,
            itemType: 'playlist',
            itemId: 4,
            position: 4,
            createdAt: new Date('2024-01-10'),
        },
        {
            sectionId: 5,
            itemType: 'playlist',
            itemId: 5,
            position: 5,
            createdAt: new Date('2024-01-10'),
        },

        // Section 6 (Trending Now - track_grid): 12 popular tracks
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 1,
            position: 1,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 16,
            position: 2,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 52,
            position: 3,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 89,
            position: 4,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 234,
            position: 5,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 456,
            position: 6,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 567,
            position: 7,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 678,
            position: 8,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 723,
            position: 9,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 745,
            position: 10,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 789,
            position: 11,
            createdAt: new Date('2024-01-12'),
        },
        {
            sectionId: 6,
            itemType: 'track',
            itemId: 800,
            position: 12,
            createdAt: new Date('2024-01-12'),
        },

        // Section 7 (Artists to Watch - artist_grid): 8 artists
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 1,
            position: 1,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 5,
            position: 2,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 8,
            position: 3,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 12,
            position: 4,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 20,
            position: 5,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 25,
            position: 6,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 35,
            position: 7,
            createdAt: new Date('2024-01-14'),
        },
        {
            sectionId: 7,
            itemType: 'artist',
            itemId: 40,
            position: 8,
            createdAt: new Date('2024-01-14'),
        },

        // Section 8 (New Releases - playlist_carousel): 3-4 playlists
        {
            sectionId: 8,
            itemType: 'playlist',
            itemId: 2,
            position: 1,
            createdAt: new Date('2024-01-16'),
        },
        {
            sectionId: 8,
            itemType: 'playlist',
            itemId: 4,
            position: 2,
            createdAt: new Date('2024-01-16'),
        },
        {
            sectionId: 8,
            itemType: 'playlist',
            itemId: 6,
            position: 3,
            createdAt: new Date('2024-01-16'),
        },
        {
            sectionId: 8,
            itemType: 'playlist',
            itemId: 7,
            position: 4,
            createdAt: new Date('2024-01-16'),
        },

        // Section 9 (Genre Spotlight - track_grid): 10 electronic/dance tracks
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 45,
            position: 1,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 78,
            position: 2,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 156,
            position: 3,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 203,
            position: 4,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 301,
            position: 5,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 412,
            position: 6,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 523,
            position: 7,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 634,
            position: 8,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 712,
            position: 9,
            createdAt: new Date('2024-01-18'),
        },
        {
            sectionId: 9,
            itemType: 'track',
            itemId: 834,
            position: 10,
            createdAt: new Date('2024-01-18'),
        },

        // Section 10 (Rising Stars - artist_grid): 6 artists
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 15,
            position: 1,
            createdAt: new Date('2024-01-20'),
        },
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 22,
            position: 2,
            createdAt: new Date('2024-01-20'),
        },
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 28,
            position: 3,
            createdAt: new Date('2024-01-20'),
        },
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 33,
            position: 4,
            createdAt: new Date('2024-01-20'),
        },
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 42,
            position: 5,
            createdAt: new Date('2024-01-20'),
        },
        {
            sectionId: 10,
            itemType: 'artist',
            itemId: 47,
            position: 6,
            createdAt: new Date('2024-01-20'),
        },
    ];

    await db.insert(sectionItems).values(sampleSectionItems);
    
    console.log('✅ Section items seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
