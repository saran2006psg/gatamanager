import { FAILURE_CONDITION_OPTIONS, type FailureCondition, type Product, type ProductRecord, type TestImage } from '@/types/dataset';

export const VALID_FAILURE_CONDITIONS = FAILURE_CONDITION_OPTIONS.map((item) => item.value);

export function getConditionLabel(condition: FailureCondition) {
  return FAILURE_CONDITION_OPTIONS.find((item) => item.value === condition)?.label ?? condition;
}

export function getCompletedConditionCount(images: Array<{ failure_condition: FailureCondition }>) {
  const unique = new Set(images.map((image) => image.failure_condition));
  return unique.size;
}

export function productToCsvRow(product: Product) {
  return [product.product_id, product.product_name ?? '', product.ornament_type, product.original_image_path].join(',');
}

export function testImageToCsvRow(image: TestImage) {
  return [
    image.id ?? '',
    image.image_path,
    image.product_id,
    image.failure_condition,
    image.notes ?? '',
  ].join(',');
}

export function buildDatasetCsv(images: TestImage[]) {
  const header = 'image_id,image_path,product_id,failure_condition,notes';
  const rows = images.map((image) => testImageToCsvRow(image));
  return [header, ...rows].join('\n');
}

export function buildProductsCsv(products: Product[]) {
  const header = 'product_id,product_name,ornament_type,original_image_path';
  const rows = products.map((product) => productToCsvRow(product));
  return [header, ...rows].join('\n');
}

export function getProductProgress(productImages: Array<{ failure_condition: FailureCondition }>) {
  const completed = new Set(productImages.map((image) => image.failure_condition));
  return {
    completedCount: completed.size,
    totalConditions: VALID_FAILURE_CONDITIONS.length,
    completedSet: completed,
  };
}

export function getProductSummary(product: ProductRecord, images: Array<{ failure_condition: FailureCondition }>) {
  const progress = getProductProgress(images);
  return {
    productId: product.product_id,
    conditionCount: progress.completedCount,
    totalConditions: progress.totalConditions,
    imageCount: images.length,
  };
}
