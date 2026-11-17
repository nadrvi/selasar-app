import { query } from './backend/src/config/db.js';

async function main() {
  const places = await query('SELECT id, name, image_url FROM places LIMIT 10;');
  console.log('Places:', places.rows);
  const placeImages = await query('SELECT * FROM place_images LIMIT 10;');
  console.log('Place images:', placeImages.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
