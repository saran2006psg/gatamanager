import Link from 'next/link';
import type { ProductRecord } from '@/types/dataset';

type ProductCardProps = {
  product: ProductRecord;
  imageCount: number;
  conditionCount: number;
};

export default function ProductCard({ product, imageCount, conditionCount }: ProductCardProps) {
  return (
    <Link href={`/products/${product.product_id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-800">{product.product_id}</div>
          <div className="text-sm text-slate-600">{product.ornament_type}</div>
        </div>
        <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {conditionCount}/10 conditions
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-600">{imageCount} test images</div>
    </Link>
  );
}
