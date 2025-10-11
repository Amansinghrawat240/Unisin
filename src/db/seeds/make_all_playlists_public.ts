import { db } from '@/db';
import { playlists } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🎵 Updating all private playlists to public...\n');

  try {
    // Find all private playlists
    const privatePlaylists = await db
      .select({
        id: playlists.id,
        title: playlists.title,
        ownerId: playlists.ownerId
      })
      .from(playlists)
      .where(eq(playlists.isPublic, false));

    console.log(`Found ${privatePlaylists.length} private playlists\n`);

    if (privatePlaylists.length === 0) {
      console.log('✅ No private playlists found. All playlists are already public!');
      return;
    }

    // Show which playlists will be updated
    console.log('Playlists that will be made public:');
    privatePlaylists.forEach((playlist, index) => {
      console.log(`  ${index + 1}. "${playlist.title}" (ID: ${playlist.id}, Owner: ${playlist.ownerId || 'Editorial'})`);
    });

    console.log('\n🔄 Updating playlists...');

    // Update all private playlists to public
    const result = await db
      .update(playlists)
      .set({
        isPublic: true,
        updatedAt: new Date()
      })
      .where(eq(playlists.isPublic, false));

    console.log(`\n✅ Successfully updated ${privatePlaylists.length} playlists to public!`);
    console.log('\n📢 All playlists are now visible to other users when they visit user profiles.');

  } catch (error) {
    console.error('❌ Error updating playlists:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });