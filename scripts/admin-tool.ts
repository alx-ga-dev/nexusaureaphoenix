
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import axios from 'axios';

// Import all seed data, using the correct 'wishList' export
import { users, collections, rarities, gifts, transactions, wishList } from '../src/lib/data';

// --- Firebase Admin SDK Initialization ---
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set in .env.local');
}
const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decodedKey);
const app = initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// --- Helper Functions for Seeding ---

async function seedGiftsWithImages() {
  console.log('🖼️  Seeding gifts and uploading images to Storage...');
  const bucketName = serviceAccount.project_id + '.appspot.com';
  const bucket = storage.bucket(bucketName);
  const giftCollectionRef = firestore.collection('gifts');

  for (const gift of gifts) {
    if (!gift.imageUrl || gift.imageUrl.startsWith('http')) {
      console.warn(` -> Gift ${gift.name.en} has no image or already has a remote URL. Storing as is.`);
      await giftCollectionRef.doc(gift.id).set(gift);
      continue;
    }

    try {
      console.log(` -> Processing gift: ${gift.name.en}`);
      const imageUrl = new URL(gift.imageUrl, 'http://localhost:3000').href;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';
      const originalFilename = gift.imageUrl.split('/').pop() || gift.id;
      const file = bucket.file(`gift-images/${originalFilename}`);

      await file.save(imageBuffer, { metadata: { contentType } });
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

      console.log(`   - Uploaded image to ${publicUrl}`);
      const giftWithStorageUrl = { ...gift, imageUrl: publicUrl };
      await giftCollectionRef.doc(gift.id).set(giftWithStorageUrl);
      console.log(`   - Saved gift document to Firestore.`);

    } catch (error: any) {
      console.error(`❌ Failed to process image for gift ${gift.name.en}:`, error.message);
    }
  }
  console.log('✅ Gift and image seeding complete.');
}

// --- Main Initialization Function ---

async function initDatabase() {
  console.log('🌱 Initializing database with all seed data...');

  // 1. Create a simple map from the pre-grouped wishlist data for easy lookup.
  console.log('❤️  Processing wishlist data...');
  const userWishlists = new Map<string, string[]>(wishList.map(item => [item.userId, item.giftIds]));
  console.log(`✅ Wishlist data processed for ${userWishlists.size} users.`);

  // 2. Seed users, directly embedding their wishlists into their documents.
  console.log('👤 Seeding users and creating auth records...');
  for (const user of users) {
    const userWithWishlist = {
      ...user,
      wishlist: userWishlists.get(user.id) || [], 
    };

    try {
      var usrRoleLevel = 0;
      if (user.roleLevel) {
        usrRoleLevel = user.roleLevel;
      }
      await firestore.collection('users').doc(user.id).set(userWithWishlist);
      console.log(`   - Created Firestore document for ${user.name} with ${userWithWishlist.wishlist.length} wishlist items.`);
    } catch (error: any) {
      if (error.code === 'already-exists') {
        console.warn(` -> User ${user.name} (${user.id}) already exists. Verifying and updating...`);
        var usrRoleLevel = 0;
        if (user.roleLevel) {
          usrRoleLevel = user.roleLevel;
        }
        await firestore.collection('users').doc(user.id).set(userWithWishlist, { merge: true });
        console.log(`   - Ensured Firestore document for ${user.name} includes ${userWithWishlist.wishlist.length} wishlist items.`);
      } else {
        console.error(`❌ Error creating user ${user.name}:`, error.message);
      }
    }
  }
  console.log('✅ User and wishlist seeding complete.');

  // 3. Seed simple top-level collections
  const seedCollection = async (name: string, data: any[]) => {
      console.log(`🌱 Seeding ${name}...`);
      const batch = firestore.batch();
      const collectionRef = firestore.collection(name);
      data.forEach((item) => {
          const docRef = collectionRef.doc(item.id);
          batch.set(docRef, item);
      });
      await batch.commit();
      console.log(`✅ ${name} seeded.`);
  }

  await seedCollection('collections', collections);
  await seedCollection('rarities', rarities);
  await seedCollection('transactions', transactions);
  
  // 4. Seed gifts (which includes uploading their images)
  await seedGiftsWithImages();

  console.log('\n🎉 Database initialization complete! All data has been loaded correctly.');
  process.exit(0);
}

// --- Original Admin/Check Functions (unchanged) ---

async function setAdmin(uid: string) {
  console.log(`Attempting to set admin claim and role for user: ${uid}`);
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log('✅ Successfully set admin custom claim.');
    
    const userRef = firestore.collection('users').doc(uid);
    await userRef.set({ isAdmin: true }, { merge: true });
    console.log('✅ Successfully updated user document in Firestore.');
    console.log('The user must log out and log back in for the changes to take effect.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error setting admin privileges:', error.message);
    process.exit(1);
  }
}

async function checkStatus(uid: string) {
  console.log(`🔍 Checking claims and data for user: ${uid}`);
  try {
    const userRecord = await auth.getUser(uid);
    console.log('-- Firebase Auth --');
    console.log(`  Email: ${userRecord.email || '(none)'}`);
    console.log('  Custom Claims:', userRecord.customClaims || '(none)');

    const userDoc = await firestore.collection('users').doc(uid).get();
    console.log('\n-- Firestore DB --');
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`  Document ID: ${userDoc.id}`);
      console.log(`  Name: ${userData?.name}`);
      console.log(`  isAdmin Field: ${userData?.isAdmin || false}`);
    } else {
      console.log('  No corresponding user document found in Firestore.');
    }
    process.exit(0);

  } catch (error: any) {
     if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: No user found with UID "${uid}" in Firebase Authentication.`);
    } else {
      console.error('❌ Error fetching user data:', error.message);
    }
    process.exit(1);
  }
}


// --- Main Execution Logic ---
function showUsage() {
    console.error('Usage:');
    console.error('  ts-node scripts/set-admin.ts init');
    console.error('      (Initializes the database, uploads images, and seeds all data.)\n');
    console.error('  ts-node scripts/set-admin.ts set <USER_ID>');
    console.error('      (Grants admin rights to an existing user)\n');
    console.error('  ts-node scripts/set-admin.ts check <USER_ID>');
    console.error('      (Checks claims and data for an existing user)\n');
    process.exit(1);
}

const action = process.argv[2];
const uidArg = process.argv[3];

if (!action) {
    showUsage();
}

switch (action) {
    case 'init':
        initDatabase().catch(err => {
            console.error('\n❌ A critical error occurred during database initialization:');
            console.error(err);
            process.exit(1);
        });
        break;
    case 'set':
        if (!uidArg) showUsage();
        setAdmin(uidArg);
        break;
    case 'check':
        if (!uidArg) showUsage();
        checkStatus(uidArg);
        break;
    default:
        showUsage();
}