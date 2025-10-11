import { db } from '@/db';
import { playlists } from '@/db/schema';

async function main() {
    const samplePlaylists = [
        {
            ownerId: null,
            title: 'Discover Weekly (Sample)',
            description: 'Your weekly mix of fresh discoveries and hidden gems tailored just for you.',
            coverUrl: 'https://picsum.photos/300x300?random=1',
            isPublic: true,
            createdAt: new Date('2024-12-01T10:00:00Z'),
            updatedAt: new Date('2024-12-01T10:00:00Z'),
        },
        {
            ownerId: null,
            title: 'Top Hits 2025',
            description: 'The biggest hits and trending tracks defining 2025. Stay current with the hottest music.',
            coverUrl: 'https://picsum.photos/300x300?random=2',
            isPublic: true,
            createdAt: new Date('2024-12-05T14:30:00Z'),
            updatedAt: new Date('2024-12-15T09:45:00Z'),
        },
        {
            ownerId: null,
            title: 'Chill Vibes',
            description: 'Relaxing tunes for unwinding, studying, or just taking it easy. Perfect background music.',
            coverUrl: 'https://picsum.photos/300x300?random=3',
            isPublic: true,
            createdAt: new Date('2024-12-03T16:20:00Z'),
            updatedAt: new Date('2024-12-10T11:15:00Z'),
        },
        {
            ownerId: null,
            title: 'Workout Motivation',
            description: 'High-energy tracks to power through your workout. Pump up the intensity and crush your goals.',
            coverUrl: 'https://picsum.photos/300x300?random=4',
            isPublic: true,
            createdAt: new Date('2024-12-02T08:00:00Z'),
            updatedAt: new Date('2024-12-12T07:30:00Z'),
        },
        {
            ownerId: null,
            title: 'Late Night Jazz',
            description: 'Smooth jazz standards and contemporary pieces for those intimate late-night moments.',
            coverUrl: 'https://picsum.photos/300x300?random=5',
            isPublic: true,
            createdAt: new Date('2024-11-28T22:45:00Z'),
            updatedAt: new Date('2024-12-08T20:30:00Z'),
        },
        {
            ownerId: null,
            title: 'Rock Classics',
            description: 'Timeless rock anthems and legendary tracks that shaped generations. Pure rock excellence.',
            coverUrl: 'https://picsum.photos/300x300?random=6',
            isPublic: true,
            createdAt: new Date('2024-11-25T15:00:00Z'),
            updatedAt: new Date('2024-12-07T13:20:00Z'),
        },
        {
            ownerId: null,
            title: 'Electronic Pulse',
            description: 'Electronic beats and synthesized sounds from ambient to dance. Feel the digital rhythm.',
            coverUrl: 'https://picsum.photos/300x300?random=7',
            isPublic: true,
            createdAt: new Date('2024-12-04T19:15:00Z'),
            updatedAt: new Date('2024-12-14T16:50:00Z'),
        }
    ];

    await db.insert(playlists).values(samplePlaylists);
    
    console.log('✅ Editorial playlists seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});