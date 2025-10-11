import { db } from '@/db';
import { creators } from '@/db/schema';

async function main() {
    const sampleCreators = [
        {
            userId: 'user-123',
            displayName: 'Alex Rivera',
            bio: 'Independent musician and producer specializing in electronic and ambient music. Creating soundscapes for over 8 years.',
            email: 'alex.rivera@email.com',
            country: 'United States',
            status: 'approved' as const,
            termsAcceptedAt: new Date('2024-01-15T10:30:00Z'),
            notes: null,
            createdAt: new Date('2024-01-15T10:30:00Z'),
            updatedAt: new Date('2024-01-20T14:22:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            displayName: 'Maya Chen',
            bio: 'Singer-songwriter from Toronto, blending folk and indie pop with heartfelt lyrics and acoustic melodies.',
            email: 'maya.chen@email.com',
            country: 'Canada',
            status: 'approved' as const,
            termsAcceptedAt: new Date('2024-01-22T16:45:00Z'),
            notes: null,
            createdAt: new Date('2024-01-22T16:45:00Z'),
            updatedAt: new Date('2024-01-22T16:45:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            displayName: 'The Midnight Collective',
            bio: 'A collaborative project bringing together underground hip-hop and jazz fusion artists from around the globe.',
            email: 'collective@midnightmusic.com',
            country: 'United Kingdom',
            status: 'pending' as const,
            termsAcceptedAt: new Date('2024-02-01T09:15:00Z'),
            notes: null,
            createdAt: new Date('2024-02-01T09:15:00Z'),
            updatedAt: new Date('2024-02-01T09:15:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            displayName: 'Santiago Rodriguez',
            bio: 'Latin rock guitarist and composer from Mexico City. Passionate about fusing traditional Mexican sounds with modern rock.',
            email: 'santiago.rodriguez@email.com',
            country: 'Mexico',
            status: 'pending' as const,
            termsAcceptedAt: new Date('2024-02-10T13:20:00Z'),
            notes: null,
            createdAt: new Date('2024-02-10T13:20:00Z'),
            updatedAt: new Date('2024-02-10T13:20:00Z'),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            displayName: 'DJ SoundWave',
            bio: 'Electronic dance music producer and DJ specializing in house and techno beats.',
            email: 'dj.soundwave@email.com',
            country: 'Germany',
            status: 'suspended' as const,
            termsAcceptedAt: new Date('2024-01-08T11:00:00Z'),
            notes: 'Account suspended due to copyright infringement claims on submitted tracks. Under review pending resolution of legal issues.',
            createdAt: new Date('2024-01-08T11:00:00Z'),
            updatedAt: new Date('2024-02-15T16:30:00Z'),
        }
    ];

    await db.insert(creators).values(sampleCreators);
    
    console.log('✅ Creators seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});