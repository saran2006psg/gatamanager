'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client';
import { ORNAMENT_TYPES, type OrnamentType } from '@/types/dataset';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function HomePage() {
  const router = useRouter();
  const [productId, setProductId] = useState('JW_005925');
  const [productName, setProductName] = useState('');
  const [ornamentType, setOrnamentType] = useState<OrnamentType>('Ring');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(productId.trim()) && Boolean(ornamentType) && Boolean(originalFile),
    [productId, ornamentType, originalFile],
  );

  const handleFileChange = (file: File | null) => {
    setError('');
    if (!file) {
      setOriginalFile(null);
      setPreviewUrl('');
      return;
    }

    const validType = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
    if (!validType) {
      setError('Unsupported file type. Please upload JPG, JPEG, PNG, or WEBP.');
      setOriginalFile(null);
      setPreviewUrl('');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image is too large. Please upload an image smaller than 10 MB.');
      setOriginalFile(null);
      setPreviewUrl('');
      return;
    }

    setOriginalFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!hasSupabaseConfig) {
      setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.');
      return;
    }

    if (!productId.trim() || !ornamentType || !originalFile) {
      setError('Please enter Product ID, select an ornament type, and upload the catalogue image.');
      return;
    }

    try {
      setSaving(true);

      const cleanProductId = productId.trim();
      const filePath = `${cleanProductId}/original.jpg`;

      const uploadResult = await supabase.storage.from('catalogue-images').upload(filePath, originalFile, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadResult.error) {
        throw new Error('Upload failed. Please try again.');
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('product_id')
        .eq('product_id', cleanProductId)
        .maybeSingle();

      if (existingProduct) {
        throw new Error('A product with this ID already exists.');
      }

      const { error: insertError } = await supabase.from('products').insert({
        product_id: cleanProductId,
        product_name: productName.trim() || cleanProductId,
        ornament_type: ornamentType,
        original_image_path: filePath,
      });

      if (insertError) {
        throw new Error('Could not save product. Please try again.');
      }

      router.push(`/products/${encodeURIComponent(cleanProductId)}`);
    } catch (submitError) {
      const fallback = submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.';
      setError(fallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Dataset setup</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Jewellery Stumper Dataset Collector</h1>
        </div>
        <Link href="/products" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          View products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Select Ornament Type</label>
            <select
              value={ornamentType}
              onChange={(event) => setOrnamentType(event.target.value as OrnamentType)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none ring-0 focus:border-slate-400"
            >
              {ORNAMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Product ID</label>
            <input
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="JW_005925"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Product Name (optional)</label>
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Example: Gold ring set"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Capture Original Clean Catalogue Image</label>
          <CameraCapture onCapture={handleFileChange} label="Open Webcam" />
          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img src={previewUrl} alt="Catalogue preview" className="h-64 w-full rounded-lg object-cover" />
            </div>
          ) : null}
        </div>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Saving...' : 'Start Collection'}
        </button>
      </form>
    </main>
  );
}
