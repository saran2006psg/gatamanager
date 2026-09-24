'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client';
import { getProductProgress } from '@/lib/dataset';
import ProductCard from '@/components/ProductCard';
import type { ProductRecord } from '@/types/dataset';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      if (!hasSupabaseConfig) {
        setLoading(false);
        setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.');
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error('Could not load products.');

        const productsWithMeta = await Promise.all(
          (data ?? []).map(async (product) => {
            const { data: images, error: imageError } = await supabase
              .from('test_images')
              .select('failure_condition')
              .eq('product_id', product.product_id);

            if (imageError) {
              return { ...product, imageCount: 0, conditionCount: 0 } as ProductRecord;
            }

            const progress = getProductProgress(images ?? []);
            return {
              ...product,
              test_images_count: images?.length ?? 0,
              completed_conditions: progress.completedCount,
            } as ProductRecord;
          }),
        );

        setProducts(productsWithMeta);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-8 text-slate-700">Loading products...</main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Collections</p>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
        </div>
        <Link href="/" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          New product
        </Link>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600 md:col-span-2">
            No products collected yet.
          </div>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              imageCount={product.test_images_count ?? 0}
              conditionCount={product.completed_conditions ?? 0}
            />
          ))
        )}
      </div>
    </main>
  );
}
