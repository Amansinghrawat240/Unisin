import { db } from '@/db';
import { playlistFollows } from '@/db/schema';

async function main() {
    const samplePlaylistFollows = [
        // user-123 follows 4 playlists (for testing purposes)
        {
            playlistId: 1,
            userId: 'user-123',
            createdAt: new Date('2024-12-01T10:30:00Z'),
        },
        {
            playlistId: 3,
            userId: 'user-123',
            createdAt: new Date('2024-12-05T14:15:00Z'),
        },
        {
            playlistId: 5,
            userId: 'user-123',
            createdAt: new Date('2024-12-10T09:45:00Z'),
        },
        {
            playlistId: 7,
            userId: 'user-123',
            createdAt: new Date('2024-12-15T16:20:00Z'),
        },
        
        // Popular playlist 1 has multiple followers
        {
            playlistId: 1,
            userId: 'user-456',
            createdAt: new Date('2024-12-02T11:20:00Z'),
        },
        {
            playlistId: 1,
            userId: 'user-789',
            createdAt: new Date('2024-12-03T13:45:00Z'),
        },
        {
            playlistId: 1,
            userId: 'user-abc',
            createdAt: new Date('2024-12-08T08:30:00Z'),
        },
        
        // Popular playlist 2 has multiple followers
        {
            playlistId: 2,
            userId: 'user-456',
            createdAt: new Date('2024-12-04T15:10:00Z'),
        },
        {
            playlistId: 2,
            userId: 'user-def',
            createdAt: new Date('2024-12-06T12:25:00Z'),
        },
        {
            playlistId: 2,
            userId: 'user-abc',
            createdAt: new Date('2024-12-12T17:40:00Z'),
        },
        
        // Playlist 3 followers
        {
            playlistId: 3,
            userId: 'user-789',
            createdAt: new Date('2024-12-07T10:15:00Z'),
        },
        {
            playlistId: 3,
            userId: 'user-def',
            createdAt: new Date('2024-12-11T14:30:00Z'),
        },
        
        // Playlist 4 followers
        {
            playlistId: 4,
            userId: 'user-456',
            createdAt: new Date('2024-12-09T09:20:00Z'),
        },
        {
            playlistId: 4,
            userId: 'user-abc',
            createdAt: new Date('2024-12-13T11:55:00Z'),
        },
        {
            playlistId: 4,
            userId: 'user-def',
            createdAt: new Date('2024-12-16T13:10:00Z'),
        },
        
        // Playlist 5 followers
        {
            playlistId: 5,
            userId: 'user-789',
            createdAt: new Date('2024-12-14T16:45:00Z'),
        },
        {
            playlistId: 5,
            userId: 'user-def',
            createdAt: new Date('2024-12-17T10:25:00Z'),
        },
        
        // Playlist 6 followers
        {
            playlistId: 6,
            userId: 'user-456',
            createdAt: new Date('2024-12-18T12:35:00Z'),
        },
        
        // Playlist 7 followers
        {
            playlistId: 7,
            userId: 'user-abc',
            createdAt: new Date('2024-12-19T15:50:00Z'),
        },
    ];

    await db.insert(playlistFollows).values(samplePlaylistFollows);
    
    console.log('✅ Playlist follows seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
