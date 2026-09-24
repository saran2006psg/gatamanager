# Jewellery Stumper Dataset Collector

## Quick start

1. `npm install`
2. Create a Supabase project
3. Run `supabase/schema.sql` in the Supabase SQL editor
4. Add your Supabase values to `.env.local`
5. `npm run dev`
6. Deploy to Vercel

## Dataset structure

- `products` stores the product metadata and original catalogue image path.
- `test_images` stores each real-world stumper image with its product ID and failure condition.
- The app uploads catalogue images to the `catalogue-images` bucket and real-world test shots to the `stumper-images` bucket.
- CSV export downloads dataset rows for both products and test images.
# gatamanager
