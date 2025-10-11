import { db } from '@/db';
import { homepageSections } from '@/db/schema';

async function main() {
    const sampleSections = [
        {
            title: "Editor's Choice",
            subtitle: "Handpicked tracks curated by our editorial team",
            type: "playlist_carousel",
            position: 1,
            isVisible: true,
            createdBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            title: "Hot Tracks",
            subtitle: "Trending tracks across all genres",
            type: "track_grid",
            position: 2,
            isVisible: true,
            createdBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(homepageSections).values(sampleSections);
    
    console.log('✅ Homepage sections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
