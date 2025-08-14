// app/products/[id]/page.tsx
import ProductDetails from '@/components/ProductDetails';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const res = await fetch(`http://localhost:3001/api/products/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const product = await res.json();

  return (
    <div>
      <Header />
      <main>
        <ProductDetails product={product} />
      </main>
    </div>
  );
}
