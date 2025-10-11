import { db } from '@/db';
import { adminSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const dropboxSetting = {
        settingKey: 'dropbox_access_token',
        settingValue: 'sl.u.AGB4VeEaFhxwLVSFmkflqaRoEnQ0_lUjtBHmFipRQddI1x8kFA3H0YG4njeIrMauhnT6ojUTtAmxpPE-vfxzFpXuwhFwvBOEgZRD2CgrybRt9tqLYwzhS7vLeDr0x4kjgdfTRiRR2lmJSc64Mkc0BywBUyLz6rrryhVShs7FHrk4mk8ixbYqRva4njvo9YAUvzCcMRAJIk5LDGfPoZxfDFY4zufsus5oZ1HH6nRJtPLbzefsTF3eQgR0u8fjTLUMALmPq4v2nU0_7XceVqvJYEqUrxVEXChC9-e4SJeMM7e7_OaGxiR0iSMmkNRnO22yLx5rmpipwKcKmh8wS64_LWI6Yg4rGCi_xUMx9_Ex9bHTEGGVM5soeZXo7T9IHnFV6jyexeV0WmodGtTrpnfvV_nj5ePKPhjjVa3ad8OD9dZtyHjr3KRLiRFr6L26ELLZZval8YeL9dkGupFSKQAJ45OB8D6Kkofg96tVeP5WMXCnhD5NlhNUw8dtj7qFnkd7Obfw5TH6GUyBL42bc3UvmH3GNY5GK70b-iayxZSFQpbFtFnU_sMJycYzNXyNz7H4EbpDEFGm8or4PBgbaVLduZudaRqL_ykawh8Y75BbjJpJ2Y_MTFLqnapKXGikN8OuE9DWyXmNElUhkbEik3GCToR6XFJ2-ys897wGzF33xU_wAKVULivO5tn8QFFQXorLN5A2m83tbsOVZjapuInnLJSF0_d6qR-FX0NFjDOmG6-S5_CWSJ_7HennhL4aKSm1pIDz1HJ79SkuZ8AUXrfcyX_LLprw3q_GqAAKx2kQGKnun3OBGZs8KR-BB99Hdd7GQ8gpcGwMpdvMNqAUik8USsv4JPkor6iBqTtxzLfnE8dJdJCCDoSHiNOFVkMMIvSjFN9f_TTWLQU7SMB1OMSvyn9BVxe-iynI_bN_OhGE-oH_C6J_u6Wm1X2Dt0YPsUx3e0UewLJVGy-XCAjtU7Y0AHLoGFVCFIuxxNnrYKD_rzM9pMvhPVagB7ulS2RtUYTfqYZFTj5uTPkKNO3nrNLtra9DWylrvKHxpQ0-Ryf_NUHV5wqpZA6GeqFNW2yrPnmehaoZmBgnqpUZFkre5VBV3PuzLUw_J9dHEf-kf3EOzF1xBa9bPrcQDEWh6b48fIisr9Rp3Al-wpp8M2dCdzcXhklkIT6kogpaDaPmP1-33Z3-MO_UUTNkXzjwsebZ1yeDzHA6rO_xnH_3YwuaLPgyuGLaymJAvEaIyIM90-V3PjJx7fH6JNbcLG7McecODLtTs5EOMhFZv-PV0wylHsKbxwy7J4DwKBuSxFZ_6FdwMBaMVphiLLX0SZ8FRQEkr_tiaoFBxlW_z0o2at0KiMCCK0dr2BZHCMseWqa_nqtFpTNt_vwHSdhBaINhaQLOlvGwLka-W6YA-WCiiCNFi-Rf2XNM',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const existingSetting = await db
        .select()
        .from(adminSettings)
        .where(eq(adminSettings.settingKey, 'dropbox_access_token'))
        .limit(1);

    if (existingSetting.length > 0) {
        await db
            .update(adminSettings)
            .set({
                settingValue: dropboxSetting.settingValue,
                updatedAt: new Date(),
            })
            .where(eq(adminSettings.settingKey, 'dropbox_access_token'));
        
        console.log('✅ Dropbox access token setting updated successfully');
    } else {
        await db.insert(adminSettings).values(dropboxSetting);
        
        console.log('✅ Dropbox access token setting created successfully');
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
