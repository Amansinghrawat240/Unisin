import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date();
    
    const sampleUsers = [
        {
            id: 'user-123',
            name: 'Alex Chen',
            email: 'alex.chen@example.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            id: 'user-456',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            id: 'user-789',
            name: 'Marcus Rodriguez',
            email: 'marcus.rodriguez@example.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            id: 'user-abc',
            name: 'Emma Thompson',
            email: 'emma.thompson@example.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            id: 'user-def',
            name: 'James Wilson',
            email: 'james.wilson@example.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});