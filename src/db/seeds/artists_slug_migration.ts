import { db } from '@/db';
import { artists } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    function generateSlug(name: string): string {
        if (!name || name.trim() === '') {
            return 'unnamed-artist';
        }
        
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
            const existing = await db.select().from(artists).where(eq(artists.slug, slug));
            
            if (existing.length === 0 || (excludeId && existing[0]?.id === excludeId)) {
                return slug;
            }
            
            counter++;
            slug = `${baseSlug}-${counter}`;
        }
    }

    try {
        const existingArtists = await db.select().from(artists);
        
        if (existingArtists.length === 0) {
            console.log('No artists found to migrate');
            return;
        }

        console.log(`🔄 Migrating ${existingArtists.length} artists to add slug fields...`);
        
        for (const artist of existingArtists) {
            const baseSlug = generateSlug(artist.name);
            const uniqueSlug = await ensureUniqueSlug(baseSlug, artist.id);
            
            await db.update(artists)
                .set({ slug: uniqueSlug })
                .where(eq(artists.id, artist.id));
            
            console.log(`✓ "${artist.name}" → "${uniqueSlug}"`);
        }
        
        console.log('✅ Artist slug migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});