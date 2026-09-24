'use client';

import { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client';
import { buildDatasetCsv, buildProductsCsv, VALID_FAILURE_CONDITIONS } from '@/lib/dataset';

export default function DatasetPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalImages: 0, completedConditions: 0, byType: {} as Record<string, number>, byCondition: {} as Record<string, number> });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      if (!hasSupabaseConfig) {
        setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.');
        return;
      }

      try {
        const [{ data: products }, { data: images }] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('test_images').select('*'),
        ]);

        const totalProducts = products?.length ?? 0;
        const totalImages = images?.length ?? 0;

        const byType: Record<string, number> = {};
        for (const product of products ?? []) {
          byType[product.ornament_type] = (byType[product.ornament_type] ?? 0) + 1;
        }

        const byCondition: Record<string, number> = {};
        for (const item of VALID_FAILURE_CONDITIONS) byCondition[item] = 0;
        for (const image of images ?? []) {
          byCondition[image.failure_condition] = (byCondition[image.failure_condition] ?? 0) + 1;
        }

        const completedConditions = Object.values(byCondition).filter((count) => count > 0).length;

        setStats({ totalProducts, totalImages, completedConditions, byType, byCondition });
      } catch {
        setError('Unable to load dataset summary.');
      }
    };

    loadStats();
  }, []);

  const exportCsv = async (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onExportProducts = async () => {
    const { data: products, error: productError } = await supabase.from('products').select('*');
    if (productError) {
      setError('Could not export products CSV.');
      return;
    }

    await exportCsv('products.csv', buildProductsCsv(products ?? []));
  };

  const onExportDataset = async () => {
    const { data: images, error: imageError } = await supabase.from('test_images').select('*');
    if (imageError) {
      setError('Could not export dataset CSV.');
      return;
    }

    await exportCsv('dataset.csv', buildDatasetCsv(images ?? []));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Dataset Summary</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={onExportProducts} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Export products.csv</button>
          <button onClick={onExportDataset} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Export Dataset</button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total Products</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalProducts}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total Stumper Images</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalImages}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Completed Conditions</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.completedConditions}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Images by Ornament Type</h2>
          <div className="space-y-3">
            {Object.keys(stats.byType).length === 0 ? <p className="text-sm text-slate-500">No product data yet.</p> : Object.entries(stats.byType).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Images by Failure Condition</h2>
          <div className="space-y-3">
            {VALID_FAILURE_CONDITIONS.map((condition) => (
              <div key={condition} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{condition.replace(/_/g, ' ')}</span>
                <span className="font-medium">{stats.byCondition[condition] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
