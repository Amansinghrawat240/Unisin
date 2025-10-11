import { db } from '@/db';
import { homepageSections } from '@/db/schema';

async function main() {
    const sampleHomepageSections = [
        {
            title: "Editor's Picks",
            subtitle: "Hand-picked playlists curated by our music experts",
            type: "playlist_carousel",
            position: 1,
            isVisible: true,
            createdBy: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: "Trending Tracks",
            subtitle: "The hottest songs everyone's listening to right now",
            type: "track_grid",
            position: 2,
            isVisible: true,
            createdBy: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: "Popular Artists",
            subtitle: "Discover the most streamed artists of the month",
            type: "artist_grid",
            position: 3,
            isVisible: true,
            createdBy: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: "New Releases",
            subtitle: "Fresh playlists featuring the latest hits and discoveries",
            type: "playlist_carousel",
            position: 4,
            isVisible: true,
            createdBy: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(homepageSections).values(sampleHomepageSections);
    
    console.log('✅ Homepage sections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
