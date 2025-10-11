import { db } from '@/db';
import { trackArtists } from '@/db/schema';

async function main() {
    const trackArtistRelationships = [];

    // All tracks linked to their main album artist (tracks 1-800)
    for (let trackId = 1; trackId <= 800; trackId++) {
        // Calculate which album this track belongs to (assuming 10-15 tracks per album)
        const albumIndex = Math.floor((trackId - 1) / 12);
        // Calculate which artist owns this album (assuming 16 albums per artist on average)
        const mainArtistId = Math.floor(albumIndex / 16) + 1;
        
        // Ensure we don't exceed artist ID 50
        const artistId = Math.min(mainArtistId, 50);
        
        trackArtistRelationships.push({
            trackId,
            artistId,
        });
    }

    // Add collaborations for about 100 tracks
    const collaborationTracks = [
        // Pop collaborations
        { trackId: 15, artistId: 3 }, // Pop star featuring another pop artist
        { trackId: 15, artistId: 7 },
        { trackId: 42, artistId: 2 },
        { trackId: 42, artistId: 5 },
        { trackId: 68, artistId: 1 },
        { trackId: 89, artistId: 4 },
        { trackId: 89, artistId: 6 },
        
        // Hip-hop collaborations
        { trackId: 123, artistId: 12 },
        { trackId: 123, artistId: 15 },
        { trackId: 156, artistId: 11 },
        { trackId: 178, artistId: 13 },
        { trackId: 178, artistId: 16 },
        { trackId: 201, artistId: 14 },
        { trackId: 234, artistId: 10 },
        { trackId: 234, artistId: 17 },
        { trackId: 267, artistId: 12 },
        
        // Rock collaborations
        { trackId: 289, artistId: 22 },
        { trackId: 312, artistId: 21 },
        { trackId: 312, artistId: 24 },
        { trackId: 345, artistId: 23 },
        { trackId: 367, artistId: 20 },
        { trackId: 367, artistId: 25 },
        { trackId: 389, artistId: 26 },
        { trackId: 412, artistId: 27 },
        { trackId: 434, artistId: 28 },
        
        // Electronic collaborations
        { trackId: 456, artistId: 32 },
        { trackId: 478, artistId: 31 },
        { trackId: 478, artistId: 34 },
        { trackId: 501, artistId: 33 },
        { trackId: 523, artistId: 30 },
        { trackId: 523, artistId: 35 },
        { trackId: 545, artistId: 36 },
        { trackId: 567, artistId: 37 },
        
        // R&B collaborations
        { trackId: 589, artistId: 42 },
        { trackId: 612, artistId: 41 },
        { trackId: 612, artistId: 44 },
        { trackId: 634, artistId: 43 },
        { trackId: 656, artistId: 40 },
        { trackId: 656, artistId: 45 },
        { trackId: 678, artistId: 46 },
        { trackId: 701, artistId: 47 },
        
        // Cross-genre collaborations (pop + hip-hop)
        { trackId: 50, artistId: 11 }, // Pop artist featuring hip-hop artist
        { trackId: 75, artistId: 13 },
        { trackId: 125, artistId: 3 }, // Hip-hop artist featuring pop artist
        { trackId: 150, artistId: 5 },
        { trackId: 200, artistId: 7 },
        
        // Cross-genre collaborations (rock + electronic)
        { trackId: 325, artistId: 31 },
        { trackId: 450, artistId: 23 },
        { trackId: 475, artistId: 25 },
        
        // Cross-genre collaborations (R&B + pop)
        { trackId: 100, artistId: 41 },
        { trackId: 175, artistId: 43 },
        { trackId: 625, artistId: 4 },
        { trackId: 650, artistId: 6 },
        
        // More hip-hop features
        { trackId: 25, artistId: 12 },
        { trackId: 55, artistId: 14 },
        { trackId: 85, artistId: 16 },
        { trackId: 135, artistId: 15 },
        { trackId: 165, artistId: 17 },
        { trackId: 195, artistId: 11 },
        { trackId: 225, artistId: 13 },
        { trackId: 255, artistId: 10 },
        { trackId: 285, artistId: 12 },
        
        // More pop features
        { trackId: 35, artistId: 2 },
        { trackId: 65, artistId: 4 },
        { trackId: 95, artistId: 6 },
        { trackId: 145, artistId: 1 },
        { trackId: 185, artistId: 3 },
        { trackId: 215, artistId: 5 },
        { trackId: 245, artistId: 7 },
        { trackId: 275, artistId: 8 },
        
        // Electronic features
        { trackId: 485, artistId: 32 },
        { trackId: 510, artistId: 34 },
        { trackId: 535, artistId: 36 },
        { trackId: 560, artistId: 38 },
        { trackId: 585, artistId: 39 },
        
        // Rock features
        { trackId: 300, artistId: 21 },
        { trackId: 330, artistId: 23 },
        { trackId: 360, artistId: 25 },
        { trackId: 390, artistId: 27 },
        { trackId: 420, artistId: 29 },
        
        // R&B features
        { trackId: 600, artistId: 41 },
        { trackId: 630, artistId: 43 },
        { trackId: 660, artistId: 45 },
        { trackId: 690, artistId: 47 },
        { trackId: 720, artistId: 49 },
        
        // Additional collaborations to reach ~100
        { trackId: 750, artistId: 2 },
        { trackId: 750, artistId: 12 },
        { trackId: 775, artistId: 21 },
        { trackId: 775, artistId: 31 },
        { trackId: 800, artistId: 1 },
        { trackId: 800, artistId: 41 },
    ];

    // Add all collaboration relationships
    trackArtistRelationships.push(...collaborationTracks);

    await db.insert(trackArtists).values(trackArtistRelationships);
    
    console.log('✅ Track-artist relationships seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});