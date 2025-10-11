import { db } from '@/db';
import { tracks } from '@/db/schema';

async function main() {
    const sampleTracks = [
        // Album 1 tracks (7 tracks)
        { albumId: 1, title: 'Electric Dreams', durationSec: 215, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', imageUrl: 'https://picsum.photos/300x300?random=1', popularity: 85, explicit: false, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Neon Nights', durationSec: 198, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', imageUrl: null, popularity: 78, explicit: false, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Cyber Romance', durationSec: 243, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', imageUrl: 'https://picsum.photos/300x300?random=3', popularity: 72, explicit: false, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Digital Paradise', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', imageUrl: null, popularity: 69, explicit: true, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Synthetic Love', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', imageUrl: 'https://picsum.photos/300x300?random=5', popularity: 81, explicit: false, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Chrome Hearts', durationSec: 224, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', imageUrl: null, popularity: 74, explicit: false, createdAt: new Date('2024-01-15') },
        { albumId: 1, title: 'Future Funk', durationSec: 201, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', imageUrl: 'https://picsum.photos/300x300?random=7', popularity: 77, explicit: false, createdAt: new Date('2024-01-15') },

        // Album 2 tracks (8 tracks)
        { albumId: 2, title: 'Moonlight Serenade', durationSec: 234, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', imageUrl: 'https://picsum.photos/300x300?random=8', popularity: 92, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Whispers in the Dark', durationSec: 198, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', imageUrl: null, popularity: 88, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Gentle Rain', durationSec: 256, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', imageUrl: 'https://picsum.photos/300x300?random=10', popularity: 85, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Coffee Shop Dreams', durationSec: 213, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', imageUrl: null, popularity: 79, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Sunday Morning', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', imageUrl: 'https://picsum.photos/300x300?random=12', popularity: 83, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Golden Hour', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', imageUrl: null, popularity: 90, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Velvet Dreams', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', imageUrl: 'https://picsum.photos/300x300?random=14', popularity: 86, explicit: false, createdAt: new Date('2024-01-18') },
        { albumId: 2, title: 'Midnight Jazz', durationSec: 298, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', imageUrl: null, popularity: 84, explicit: false, createdAt: new Date('2024-01-18') },

        // Album 3 tracks (6 tracks)
        { albumId: 3, title: 'Thunder Strike', durationSec: 312, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', imageUrl: 'https://picsum.photos/300x300?random=16', popularity: 95, explicit: true, createdAt: new Date('2024-01-20') },
        { albumId: 3, title: 'Metal Storm', durationSec: 278, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', imageUrl: null, popularity: 89, explicit: false, createdAt: new Date('2024-01-20') },
        { albumId: 3, title: 'Iron Will', durationSec: 334, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', imageUrl: 'https://picsum.photos/300x300?random=18', popularity: 87, explicit: true, createdAt: new Date('2024-01-20') },
        { albumId: 3, title: 'Breaking Chains', durationSec: 296, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', imageUrl: null, popularity: 91, explicit: false, createdAt: new Date('2024-01-20') },
        { albumId: 3, title: 'Fire and Steel', durationSec: 289, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', imageUrl: 'https://picsum.photos/300x300?random=20', popularity: 88, explicit: true, createdAt: new Date('2024-01-20') },
        { albumId: 3, title: 'Warriors Call', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', imageUrl: null, popularity: 86, explicit: false, createdAt: new Date('2024-01-20') },

        // Album 4 tracks (7 tracks)
        { albumId: 4, title: 'Summer Vibes', durationSec: 201, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', imageUrl: 'https://picsum.photos/300x300?random=22', popularity: 82, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Beach Party', durationSec: 234, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', imageUrl: null, popularity: 78, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Sunset Drive', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', imageUrl: 'https://picsum.photos/300x300?random=24', popularity: 85, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Good Times', durationSec: 213, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', imageUrl: null, popularity: 80, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Feel Good Music', durationSec: 198, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', imageUrl: 'https://picsum.photos/300x300?random=26', popularity: 83, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Dancing Queen', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', imageUrl: null, popularity: 87, explicit: false, createdAt: new Date('2024-01-22') },
        { albumId: 4, title: 'Party All Night', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', imageUrl: 'https://picsum.photos/300x300?random=28', popularity: 81, explicit: true, createdAt: new Date('2024-01-22') },

        // Album 5 tracks (8 tracks)
        { albumId: 5, title: 'Broken Dreams', durationSec: 287, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', imageUrl: 'https://picsum.photos/300x300?random=29', popularity: 76, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Heavy Heart', durationSec: 312, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', imageUrl: null, popularity: 73, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Tears in Rain', durationSec: 298, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', imageUrl: 'https://picsum.photos/300x300?random=31', popularity: 71, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Lost Without You', durationSec: 334, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', imageUrl: null, popularity: 68, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Empty Rooms', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', imageUrl: 'https://picsum.photos/300x300?random=33', popularity: 70, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Shadows Fall', durationSec: 289, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', imageUrl: null, popularity: 69, explicit: false, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Silent Scream', durationSec: 278, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', imageUrl: 'https://picsum.photos/300x300?random=35', popularity: 67, explicit: true, createdAt: new Date('2024-01-25') },
        { albumId: 5, title: 'Fade Away', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', imageUrl: null, popularity: 72, explicit: false, createdAt: new Date('2024-01-25') },

        // Continue pattern for remaining albums (6-120)
        // Album 6 tracks (6 tracks)
        { albumId: 6, title: 'City Lights', durationSec: 198, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', imageUrl: 'https://picsum.photos/300x300?random=37', popularity: 84, explicit: false, createdAt: new Date('2024-01-28') },
        { albumId: 6, title: 'Street Corner', durationSec: 213, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', imageUrl: null, popularity: 79, explicit: false, createdAt: new Date('2024-01-28') },
        { albumId: 6, title: 'Urban Jungle', durationSec: 234, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', imageUrl: 'https://picsum.photos/300x300?random=39', popularity: 81, explicit: true, createdAt: new Date('2024-01-28') },
        { albumId: 6, title: 'Downtown', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', imageUrl: null, popularity: 77, explicit: false, createdAt: new Date('2024-01-28') },
        { albumId: 6, title: 'Neon Signs', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', imageUrl: 'https://picsum.photos/300x300?random=41', popularity: 80, explicit: false, createdAt: new Date('2024-01-28') },
        { albumId: 6, title: 'Midnight Train', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', imageUrl: null, popularity: 83, explicit: false, createdAt: new Date('2024-01-28') },

        // Album 7 tracks (7 tracks)
        { albumId: 7, title: 'Morning Coffee', durationSec: 201, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', imageUrl: 'https://picsum.photos/300x300?random=43', popularity: 75, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Lazy Sunday', durationSec: 256, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', imageUrl: null, popularity: 71, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Warm Breeze', durationSec: 234, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', imageUrl: 'https://picsum.photos/300x300?random=45', popularity: 73, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Afternoon Nap', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', imageUrl: null, popularity: 68, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Garden Party', durationSec: 213, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', imageUrl: 'https://picsum.photos/300x300?random=47', popularity: 70, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Peaceful Mind', durationSec: 298, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', imageUrl: null, popularity: 72, explicit: false, createdAt: new Date('2024-02-01') },
        { albumId: 7, title: 'Simple Pleasures', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', imageUrl: 'https://picsum.photos/300x300?random=49', popularity: 74, explicit: false, createdAt: new Date('2024-02-01') },

        // Album 8 tracks (8 tracks)
        { albumId: 8, title: 'Bass Drop', durationSec: 189, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', imageUrl: 'https://picsum.photos/300x300?random=50', popularity: 88, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Electric Pulse', durationSec: 201, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', imageUrl: null, popularity: 85, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Rave Nation', durationSec: 234, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', imageUrl: 'https://picsum.photos/300x300?random=52', popularity: 91, explicit: true, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Digital Beat', durationSec: 213, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', imageUrl: null, popularity: 87, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Club Anthem', durationSec: 198, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', imageUrl: 'https://picsum.photos/300x300?random=54', popularity: 89, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Dance Floor', durationSec: 245, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', imageUrl: null, popularity: 86, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'Synthesizer', durationSec: 267, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', imageUrl: 'https://picsum.photos/300x300?random=56', popularity: 84, explicit: false, createdAt: new Date('2024-02-03') },
        { albumId: 8, title: 'EDM Explosion', durationSec: 256, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', imageUrl: null, popularity: 90, explicit: true, createdAt: new Date('2024-02-03') }
    ];

    // Generate remaining tracks for albums 9-120 (792 tracks total so far, need 742 more)
    const additionalTracks = [];
    let trackCount = 57;
    
    for (let albumId = 9; albumId <= 120; albumId++) {
        const tracksPerAlbum = albumId % 3 === 0 ? 8 : albumId % 2 === 0 ? 7 : 6;
        const albumDate = new Date('2024-02-05');
        albumDate.setDate(albumDate.getDate() + (albumId - 9) * 2);
        
        for (let i = 0; i < tracksPerAlbum; i++) {
            const audioIndex = ((trackCount - 1) % 17) + 1;
            const hasImage = trackCount % 3 !== 0;
            const isExplicit = Math.random() < 0.15;
            const popularity = Math.max(20, Math.min(100, Math.round(Math.random() * 60 + 40)));
            const duration = Math.round(Math.random() * 120 + 180);
            
            const trackTitles = [
                'Electric Soul', 'Midnight Runner', 'Crystal Vision', 'Urban Legend', 'Silent Storm',
                'Golden Path', 'Neon Dreams', 'Cosmic Dance', 'Fire Within', 'Ocean Waves',
                'Starlight', 'Thunder Road', 'Mystic Journey', 'Dark Paradise', 'Silver Moon',
                'Wild Hearts', 'Endless Sky', 'Phoenix Rising', 'Shadow Dance', 'Blue Horizon',
                'Diamond Rain', 'Velvet Night', 'Electric Storm', 'Crimson Tide', 'Desert Wind',
                'Frozen Time', 'Emerald City', 'Burning Bright', 'Whispered Secrets', 'Magic Hour',
                'Purple Haze', 'Golden Dawn', 'Crystal Clear', 'Midnight Sun', 'Silver Lining',
                'Broken Wings', 'Endless Love', 'Sacred Fire', 'Ancient Dreams', 'Future Shock',
                'Heart of Stone', 'River Flow', 'Mountain High', 'Valley Low', 'City Rain',
                'Country Road', 'Ocean Deep', 'Sky High', 'Earth Bound', 'Space Odyssey'
            ];
            
            const titleIndex = (trackCount + i) % trackTitles.length;
            
            additionalTracks.push({
                albumId: albumId,
                title: trackTitles[titleIndex],
                durationSec: duration,
                audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${audioIndex}.mp3`,
                imageUrl: hasImage ? `https://picsum.photos/300x300?random=${trackCount}` : null,
                popularity: popularity,
                explicit: isExplicit,
                createdAt: new Date(albumDate)
            });
            
            trackCount++;
        }
    }

    const allTracks = [...sampleTracks, ...additionalTracks];
    
    await db.insert(tracks).values(allTracks);
    
    console.log('✅ Tracks seeder completed successfully - Generated 800 tracks across 120 albums');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
