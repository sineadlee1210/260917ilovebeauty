import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">새 상품 등록</h1>
      <ProductForm />
    </div>
  );
}
