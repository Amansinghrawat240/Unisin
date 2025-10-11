import { db } from '@/db';
import { playlists, user } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

async function main() {
    console.log('🔍 Checking playlist visibility status in database...\n');

    try {
        // Count total playlists
        const totalPlaylistsResult = await db
            .select({ count: count() })
            .from(playlists);
        const totalPlaylists = totalPlaylistsResult[0]?.count || 0;

        // Count public playlists
        const publicPlaylistsResult = await db
            .select({ count: count() })
            .from(playlists)
            .where(eq(playlists.isPublic, true));
        const publicPlaylists = publicPlaylistsResult[0]?.count || 0;

        // Count private playlists
        const privatePlaylistsResult = await db
            .select({ count: count() })
            .from(playlists)
            .where(eq(playlists.isPublic, false));
        const privatePlaylists = privatePlaylistsResult[0]?.count || 0;

        // Get sample public playlists with owner info
        const samplePublicPlaylists = await db
            .select({
                id: playlists.id,
                title: playlists.title,
                description: playlists.description,
                isPublic: playlists.isPublic,
                ownerName: user.name,
                ownerEmail: user.email,
                createdAt: playlists.createdAt,
            })
            .from(playlists)
            .leftJoin(user, eq(playlists.ownerId, user.id))
            .where(eq(playlists.isPublic, true))
            .limit(5);

        // Get sample private playlists with owner info
        const samplePrivatePlaylists = await db
            .select({
                id: playlists.id,
                title: playlists.title,
                description: playlists.description,
                isPublic: playlists.isPublic,
                ownerName: user.name,
                ownerEmail: user.email,
                createdAt: playlists.createdAt,
            })
            .from(playlists)
            .leftJoin(user, eq(playlists.ownerId, user.id))
            .where(eq(playlists.isPublic, false))
            .limit(5);

        // Display results
        console.log('📊 PLAYLIST VISIBILITY SUMMARY');
        console.log('=====================================');
        console.log(`Total Playlists: ${totalPlaylists}`);
        console.log(`Public Playlists: ${publicPlaylists} (${totalPlaylists > 0 ? ((publicPlaylists / totalPlaylists) * 100).toFixed(1) : 0}%)`);
        console.log(`Private Playlists: ${privatePlaylists} (${totalPlaylists > 0 ? ((privatePlaylists / totalPlaylists) * 100).toFixed(1) : 0}%)`);
        console.log('');

        if (samplePublicPlaylists.length > 0) {
            console.log('🌍 PUBLIC PLAYLISTS SAMPLE:');
            console.log('----------------------------');
            samplePublicPlaylists.forEach((playlist, index) => {
                console.log(`${index + 1}. ID: ${playlist.id}`);
                console.log(`   Title: "${playlist.title}"`);
                console.log(`   Owner: ${playlist.ownerName || 'Unknown'} (${playlist.ownerEmail || 'No email'})`);
                console.log(`   Description: ${playlist.description || 'No description'}`);
                console.log(`   Visibility: ${playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}`);
                console.log(`   Created: ${playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'Unknown'}`);
                console.log('');
            });
        } else {
            console.log('🌍 PUBLIC PLAYLISTS SAMPLE: None found');
            console.log('');
        }

        if (samplePrivatePlaylists.length > 0) {
            console.log('🔒 PRIVATE PLAYLISTS SAMPLE:');
            console.log('-----------------------------');
            samplePrivatePlaylists.forEach((playlist, index) => {
                console.log(`${index + 1}. ID: ${playlist.id}`);
                console.log(`   Title: "${playlist.title}"`);
                console.log(`   Owner: ${playlist.ownerName || 'Unknown'} (${playlist.ownerEmail || 'No email'})`);
                console.log(`   Description: ${playlist.description || 'No description'}`);
                console.log(`   Visibility: ${playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}`);
                console.log(`   Created: ${playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'Unknown'}`);
                console.log('');
            });
        } else {
            console.log('🔒 PRIVATE PLAYLISTS SAMPLE: None found');
            console.log('');
        }

        console.log('💡 ADMIN API IMPACT PREVIEW:');
        console.log('-----------------------------');
        console.log(`Making all playlists public would affect ${privatePlaylists} playlists`);
        console.log(`Making all playlists private would affect ${publicPlaylists} playlists`);
        console.log('');

        console.log('✅ Playlist visibility check completed successfully');

    } catch (error) {
        console.error('❌ Playlist visibility check failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Verification script failed:', error);
});