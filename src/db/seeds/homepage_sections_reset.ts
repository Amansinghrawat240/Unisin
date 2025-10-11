import { db } from '@/db';
import { homepageSections } from '@/db/schema';

async function main() {
    // Clear existing data
    await db.delete(homepageSections);
    
    const currentTime = new Date();
    
    const sampleSections = [
        {
            title: "Editor's Picks",
            subtitle: "Carefully curated playlists selected by our music experts",
            type: "playlist_carousel",
            position: 1,
            isVisible: true,
            createdBy: "admin",
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            title: "Trending Tracks",
            subtitle: "The hottest tracks everyone's listening to right now",
            type: "track_grid",
            position: 2,
            isVisible: true,
            createdBy: "admin",
            createdAt: currentTime,
            updatedAt: currentTime,
        },
        {
            title: "Popular Artists",
            subtitle: "Discover the most followed artists on our platform",
            type: "artist_grid",
            position: 3,
            isVisible: true,
            createdBy: "admin",
            createdAt: currentTime,
            updatedAt: currentTime,
        }
    ];

    await db.insert(homepageSections).values(sampleSections);
    
    console.log('✅ Homepage sections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
