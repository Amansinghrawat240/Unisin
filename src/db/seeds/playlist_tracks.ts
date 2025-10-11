import { db } from '@/db';
import { playlistTracks } from '@/db/schema';

async function main() {
    const playlistTracksData = [];
    
    // Playlist 1: Top Hits 2025 (90+ popularity tracks, 75 tracks)
    const topHitsTracks = [];
    for (let i = 1; i <= 75; i++) {
        // Use tracks with higher IDs for higher popularity
        const trackId = Math.floor(Math.random() * 200) + 600; // Track IDs 600-800 (highest popularity)
        topHitsTracks.push({
            playlistId: 1,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 11, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 2: Chill Vibes (60-85 popularity tracks, 60 tracks)
    const chillVibesTracks = [];
    for (let i = 1; i <= 60; i++) {
        const trackId = Math.floor(Math.random() * 300) + 200; // Track IDs 200-500 (medium popularity)
        chillVibesTracks.push({
            playlistId: 2,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 11, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 3: Workout Motivation (70-95 popularity tracks, 85 tracks)
    const workoutTracks = [];
    for (let i = 1; i <= 85; i++) {
        const trackId = Math.floor(Math.random() * 400) + 400; // Track IDs 400-800 (high energy)
        workoutTracks.push({
            playlistId: 3,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 11, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 4: Indie Rock Essentials (55 tracks)
    const indieRockTracks = [];
    for (let i = 1; i <= 55; i++) {
        const trackId = Math.floor(Math.random() * 300) + 100; // Track IDs 100-400
        indieRockTracks.push({
            playlistId: 4,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 10, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 5: R&B Classics (70 tracks)
    const rnbClassicsTracks = [];
    for (let i = 1; i <= 70; i++) {
        const trackId = Math.floor(Math.random() * 350) + 150; // Track IDs 150-500
        rnbClassicsTracks.push({
            playlistId: 5,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 10, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 6: Electronic Beats (90 tracks)
    const electronicTracks = [];
    for (let i = 1; i <= 90; i++) {
        const trackId = Math.floor(Math.random() * 500) + 250; // Track IDs 250-750
        electronicTracks.push({
            playlistId: 6,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 9, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Playlist 7: Late Night Vibes (65 tracks)
    const lateNightTracks = [];
    for (let i = 1; i <= 65; i++) {
        const trackId = Math.floor(Math.random() * 400) + 50; // Track IDs 50-450
        lateNightTracks.push({
            playlistId: 7,
            trackId: trackId,
            position: i,
            addedBy: null,
            addedAt: new Date(2024, 11, Math.floor(Math.random() * 30) + 1),
        });
    }
    
    // Combine all playlist tracks
    playlistTracksData.push(
        ...topHitsTracks,
        ...chillVibesTracks,
        ...workoutTracks,
        ...indieRockTracks,
        ...rnbClassicsTracks,
        ...electronicTracks,
        ...lateNightTracks
    );
    
    await db.insert(playlistTracks).values(playlistTracksData);
    
    console.log('✅ Playlist tracks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
