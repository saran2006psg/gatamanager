'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client';
import { FAILURE_CONDITION_OPTIONS, type FailureCondition, type Product, type TestImage } from '@/types/dataset';
import ProgressBar from '@/components/ProgressBar';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
type PendingCapture = { file: File; previewUrl: string };

const getStoragePublicUrl = (bucket: string, objectPath: string) => {
  const normalized = objectPath.startsWith(`${bucket}/`) ? objectPath.slice(bucket.length + 1) : objectPath;
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalized);
  return data.publicUrl;
};

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = decodeURIComponent(params.productId ?? '');
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<TestImage[]>([]);
  const [pendingCaptures, setPendingCaptures] = useState<Partial<Record<FailureCondition, PendingCapture>>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProductData = async () => {
    if (!hasSupabaseConfig) {
      setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (productError) throw new Error('Product not found.');

      const { data: imageData, error: imageError } = await supabase
        .from('test_images')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (imageError) throw new Error('Could not load product photos.');

      setProduct(productData);
      setImages(imageData ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load product.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const completedSet = useMemo(() => new Set(images.map((image) => image.failure_condition)), [images]);
  const completedCount = completedSet.size;

  const handleCapture = (condition: FailureCondition, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Unsupported file type. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image is too large. Please upload an image smaller than 10 MB.');
      return;
    }

    setError('');
    const previousCapture = pendingCaptures[condition];
    if (previousCapture) URL.revokeObjectURL(previousCapture.previewUrl);
    setPendingCaptures((current) => ({
      ...current,
      [condition]: { file, previewUrl: URL.createObjectURL(file) },
    }));
  };

  const saveCapturedImages = async () => {
    if (!product) {
      setError('Missing product.');
      return;
    }

    const captures = Object.entries(pendingCaptures) as Array<[FailureCondition, PendingCapture]>;
    if (captures.length === 0) return;

    try {
      setSaving(true);
      setError('');

      for (const [condition, capture] of captures) {
        const extension = capture.file.name.split('.').pop() || 'jpg';
        const safeFileName = `${crypto.randomUUID()}.${extension}`;
        const uploadPath = `${product.product_id}/${condition}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage.from('stumper-images').upload(uploadPath, capture.file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (uploadError) throw new Error(`Could not upload ${condition.replace(/_/g, ' ')} photo.`);

        const { error: insertError } = await supabase.from('test_images').insert({
          product_id: product.product_id,
          image_path: uploadPath,
          failure_condition: condition,
          notes: '',
        });

        if (insertError) throw new Error(`Could not save ${condition.replace(/_/g, ' ')} photo metadata.`);
      }

      for (const [, capture] of captures) URL.revokeObjectURL(capture.previewUrl);
      setPendingCaptures({});
      await loadProductData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save captured images.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;

    try {
      const targetImage = images.find((image) => image.id === id);
      if (targetImage?.image_path) {
        await supabase.storage.from('stumper-images').remove([targetImage.image_path]);
      }

      const { error } = await supabase.from('test_images').delete().eq('id', id);
      if (error) throw new Error('Delete failed.');
      await loadProductData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
    }
  };

  const handleNoteUpdate = async (id: string, note: string) => {
    try {
      const { error } = await supabase.from('test_images').update({ notes: note }).eq('id', id);
      if (error) throw new Error('Could not save note.');
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'Could not save note.');
    }
  };

  const exportDatasetForProduct = async () => {
    const rows = images.map((image) => [image.id ?? '', image.image_path, image.product_id, image.failure_condition, image.notes ?? ''].join(','));
    const csv = ['image_id,image_path,product_id,failure_condition,notes', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${productId}-dataset.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-8 text-slate-700">Loading product…</main>;
  }

  if (!product) {
    return <main className="mx-auto max-w-5xl px-4 py-8 text-red-700">{error || 'Product not found.'}</main>;
  }

  const byCondition = images.reduce<Record<string, TestImage[]>>((acc, image) => {
    acc[image.failure_condition] = acc[image.failure_condition] || [];
    acc[image.failure_condition].push(image);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Collection</p>
          <h1 className="text-3xl font-bold text-slate-900">Product: {product.product_id}</h1>
          <p className="text-base text-slate-600">Type: {product.ornament_type}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={exportDatasetForProduct} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Export CSV</button>
          <a href="/products" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Back to products</a>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Product</div>
            <div className="text-xl font-semibold text-slate-900">{product.product_id}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Type</div>
            <div className="text-xl font-semibold text-slate-900">{product.ornament_type}</div>
          </div>
          <div className="min-w-[220px] flex-1">
            <ProgressBar value={completedCount} total={FAILURE_CONDITION_OPTIONS.length} label="Progress" />
          </div>
        </div>
      </div>

      {product.original_image_path ? (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Original Catalogue Image</div>
          <img src={getStoragePublicUrl('catalogue-images', product.original_image_path)} alt={product.product_id} className="max-h-[320px] w-full rounded-lg object-contain" />
        </div>
      ) : null}

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm font-semibold text-slate-800">Captured photos ready to save</div>
          <div className="text-sm text-slate-500">{Object.keys(pendingCaptures).length} condition photo(s) captured</div>
        </div>
        <button
          type="button"
          onClick={saveCapturedImages}
          disabled={Object.keys(pendingCaptures).length === 0 || saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Saving...' : 'Save captured images'}
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-3 text-lg font-semibold text-slate-800">Failure condition coverage</div>
        <div className="flex flex-wrap gap-2">
          {FAILURE_CONDITION_OPTIONS.map((option) => {
            const isComplete = completedSet.has(option.value);
            const count = byCondition[option.value]?.length ?? 0;
            return (
              <div key={option.value} className={`rounded-full px-3 py-1 text-sm ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {option.label} {isComplete ? '✓' : '○'}{count > 1 ? ` (${count})` : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {FAILURE_CONDITION_OPTIONS.map((option) => {
          const conditionImages = byCondition[option.value] ?? [];
          const isComplete = conditionImages.length > 0;
          return (
            <div key={option.value} className={`rounded-xl border p-4 ${isComplete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-800">{option.label}</div>
                  <div className="text-sm text-slate-600">{option.description}</div>
                </div>
                <div className={`rounded-full px-2 py-1 text-xs font-medium ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isComplete ? 'Completed' : 'Pending'}
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleCapture(option.value, file);
                    event.target.value = '';
                  }}
                />
                Open Camera
              </label>

              {pendingCaptures[option.value] ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="mb-2 text-xs font-medium text-amber-800">Captured locally, not saved yet</div>
                  <img src={pendingCaptures[option.value]?.previewUrl} alt={`${option.label} preview`} className="h-40 w-full rounded-md object-cover" />
                </div>
              ) : null}

              {conditionImages.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {conditionImages.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <img src={getStoragePublicUrl('stumper-images', item.image_path)} alt={option.label} className="h-20 w-20 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-700">{item.image_path.split('/').pop()}</div>
                          <div className="text-xs text-slate-500">Status: uploaded</div>
                          <textarea
                            rows={2}
                            className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                            placeholder="Optional note"
                            defaultValue={item.notes ?? ''}
                            onBlur={(event) => handleNoteUpdate(item.id!, event.target.value)}
                          />
                        </div>
                        <button type="button" onClick={() => handleDelete(item.id)} className="text-xs font-medium text-red-600">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
