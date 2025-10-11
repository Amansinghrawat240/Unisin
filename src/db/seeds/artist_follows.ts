import { db } from '@/db';
import { artistFollows } from '@/db/schema';

async function main() {
    // Clear existing data first
    await db.delete(artistFollows);

    const sampleFollows = [
        // user-123 follows artists: 11, 13, 16
        {
            userId: 'user-123',
            artistId: 11,
            createdAt: new Date('2024-10-15T14:30:00Z'),
        },
        {
            userId: 'user-123',
            artistId: 13,
            createdAt: new Date('2024-11-02T09:15:00Z'),
        },
        {
            userId: 'user-123',
            artistId: 16,
            createdAt: new Date('2024-11-18T16:45:00Z'),
        },
        // user-456 follows artists: 15, 17, 13
        {
            userId: 'user-456',
            artistId: 15,
            createdAt: new Date('2024-10-08T11:20:00Z'),
        },
        {
            userId: 'user-456',
            artistId: 17,
            createdAt: new Date('2024-10-25T13:10:00Z'),
        },
        {
            userId: 'user-456',
            artistId: 13,
            createdAt: new Date('2024-11-12T10:30:00Z'),
        },
        // user-789 follows artists: 11, 15, 16, 17
        {
            userId: 'user-789',
            artistId: 11,
            createdAt: new Date('2024-10-05T08:45:00Z'),
        },
        {
            userId: 'user-789',
            artistId: 15,
            createdAt: new Date('2024-10-20T15:25:00Z'),
        },
        {
            userId: 'user-789',
            artistId: 16,
            createdAt: new Date('2024-11-01T12:00:00Z'),
        },
        {
            userId: 'user-789',
            artistId: 17,
            createdAt: new Date('2024-11-20T17:30:00Z'),
        },
        // user-abc follows artists: 13, 16
        {
            userId: 'user-abc',
            artistId: 13,
            createdAt: new Date('2024-10-12T14:15:00Z'),
        },
        {
            userId: 'user-abc',
            artistId: 16,
            createdAt: new Date('2024-11-08T11:45:00Z'),
        },
        // user-def follows artists: 11, 17, 15, 13, 16
        {
            userId: 'user-def',
            artistId: 11,
            createdAt: new Date('2024-10-03T09:30:00Z'),
        },
        {
            userId: 'user-def',
            artistId: 17,
            createdAt: new Date('2024-10-18T13:20:00Z'),
        },
        {
            userId: 'user-def',
            artistId: 15,
            createdAt: new Date('2024-10-28T16:10:00Z'),
        },
        {
            userId: 'user-def',
            artistId: 13,
            createdAt: new Date('2024-11-05T10:50:00Z'),
        },
        {
            userId: 'user-def',
            artistId: 16,
            createdAt: new Date('2024-11-15T14:25:00Z'),
        },
    ];

    await db.insert(artistFollows).values(sampleFollows);
    
    console.log('✅ Artist follows seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});