import { db } from '@/db';
import { playlists } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🎵 Starting playlist visibility update demo...\n');

    // Step 1: Create 5 test playlists with isPublic = false
    const samplePlaylists = [
        {
            ownerId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            title: 'Private Mix #1',
            description: 'My personal collection of favorite tracks that I keep private.',
            coverUrl: 'https://picsum.photos/400/400?random=1',
            isPublic: false,
            createdAt: new Date('2024-12-10'),
            updatedAt: new Date('2024-12-10'),
        },
        {
            ownerId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            title: 'Secret Playlist',
            description: 'Hidden gems and guilty pleasures only I know about.',
            coverUrl: 'https://picsum.photos/400/400?random=2',
            isPublic: false,
            createdAt: new Date('2024-12-11'),
            updatedAt: new Date('2024-12-11'),
        },
        {
            ownerId: null,
            title: 'Hidden Gems',
            description: 'Editorial playlist featuring undiscovered artists and tracks.',
            coverUrl: 'https://picsum.photos/400/400?random=3',
            isPublic: false,
            createdAt: new Date('2024-12-12'),
            updatedAt: new Date('2024-12-12'),
        },
        {
            ownerId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            title: 'Personal Favorites',
            description: 'A curated list of songs that mean the most to me.',
            coverUrl: 'https://picsum.photos/400/400?random=4',
            isPublic: false,
            createdAt: new Date('2024-12-13'),
            updatedAt: new Date('2024-12-13'),
        },
        {
            ownerId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            title: 'Draft Playlist',
            description: 'Work in progress playlist that needs more songs before sharing.',
            coverUrl: 'https://picsum.photos/400/400?random=5',
            isPublic: false,
            createdAt: new Date('2024-12-14'),
            updatedAt: new Date('2024-12-14'),
        }
    ];

    // Insert the test playlists
    await db.insert(playlists).values(samplePlaylists);
    console.log('✅ Created 5 test playlists with isPublic = false');

    // Step 2: Query current state - count private playlists
    const privatePlaylistsBefore = await db.select().from(playlists).where(eq(playlists.isPublic, false));
    console.log(`📊 BEFORE UPDATE: Found ${privatePlaylistsBefore.length} private playlists`);
    
    privatePlaylistsBefore.forEach(playlist => {
        console.log(`   - ID: ${playlist.id}, Title: "${playlist.title}", Owner: ${playlist.ownerId || 'Editorial'}`);
    });

    // Step 3: Demonstrate the admin API update operation
    console.log('\n🔄 SIMULATING ADMIN API OPERATION: Making all private playlists public...');
    
    const updateResult = await db
        .update(playlists)
        .set({ 
            isPublic: true,
            updatedAt: new Date()
        })
        .where(eq(playlists.isPublic, false));

    console.log('✅ Update operation completed');

    // Step 4: Query after state - count public playlists
    const publicPlaylistsAfter = await db.select().from(playlists).where(eq(playlists.isPublic, true));
    console.log(`📊 AFTER UPDATE: Found ${publicPlaylistsAfter.length} public playlists`);
    
    publicPlaylistsAfter.forEach(playlist => {
        console.log(`   - ID: ${playlist.id}, Title: "${playlist.title}", Owner: ${playlist.ownerId || 'Editorial'}, Updated: ${playlist.updatedAt}`);
    });

    console.log('\n🎯 DEMO SUMMARY:');
    console.log(`   - Created ${samplePlaylists.length} private playlists`);
    console.log(`   - Updated ${privatePlaylistsBefore.length} playlists from private to public`);
    console.log(`   - All playlists now have isPublic = true and updated timestamps`);
    console.log('\n✅ Playlist visibility update demo completed successfully');
}

main().catch((error) => {
    console.error('❌ Demo failed:', error);
});
