import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, DbProduct } from '../lib/supabase';

export interface Product {
  id: string;
  name: string;
  kod?: string;
  supplier: string;
  supplierDetails?: {
    ulica?: string;
    mesto?: string;
    tel?: string;
    email?: string;
  };
  unit?: string;
  price?: number;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

// Helper to convert DB product to app product
const dbToProduct = (db: DbProduct): Product => ({
  id: db.id,
  name: db.name,
  kod: db.kod || undefined,
  supplier: db.supplier,
  supplierDetails: {
    ulica: db.supplier_ulica || undefined,
    mesto: db.supplier_mesto || undefined,
    tel: db.supplier_tel || undefined,
    email: db.supplier_email || undefined,
  },
  unit: db.unit || undefined,
  price: db.price || undefined,
});

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load products from Supabase (shared for all users)
  const loadProducts = useCallback(async () => {
    if (!userId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        // .eq('user_id', userId) // REMOVED: Shared products for everyone
        .order('supplier', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        return;
      }

      if (data) {
        setProducts(data.map(dbToProduct));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (newProductData: Omit<Product, 'id'>) => {
    if (!userId) return;

    // Check if product with same name AND supplier exists
    const existingProduct = products.find(
      p => p.name.toLowerCase() === newProductData.name.toLowerCase() &&
        p.supplier.toLowerCase() === newProductData.supplier.toLowerCase()
    );

    if (existingProduct) {
      // Update existing product
      await updateProduct(existingProduct.id, newProductData);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: newProductData.name,
          kod: newProductData.kod || null,
          supplier: newProductData.supplier,
          supplier_ulica: newProductData.supplierDetails?.ulica || null,
          supplier_mesto: newProductData.supplierDetails?.mesto || null,
          supplier_tel: newProductData.supplierDetails?.tel || null,
          supplier_email: newProductData.supplierDetails?.email || null,
          unit: newProductData.unit || null,
          price: newProductData.price || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        return;
      }

      if (data) {
        setProducts(prev => [...prev, dbToProduct(data)]);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (!userId) return;

    try {
      const updates: any = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.kod !== undefined) updates.kod = data.kod || null;
      if (data.supplier !== undefined) updates.supplier = data.supplier;
      if (data.supplierDetails?.ulica !== undefined) updates.supplier_ulica = data.supplierDetails.ulica || null;
      if (data.supplierDetails?.mesto !== undefined) updates.supplier_mesto = data.supplierDetails.mesto || null;
      if (data.supplierDetails?.tel !== undefined) updates.supplier_tel = data.supplierDetails.tel || null;
      if (data.supplierDetails?.email !== undefined) updates.supplier_email = data.supplierDetails.email || null;
      if (data.unit !== undefined) updates.unit = data.unit || null;
      if (data.price !== undefined) updates.price = data.price || null;
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
      // .eq('user_id', userId); // REMOVED to allow shared editing

      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      // .eq('user_id', userId); // REMOVED to allow shared deleting

      if (error) {
        console.error('Error deleting product:', error);
        return;
      }

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, isLoading }}>
      {children}
    </ProductsContext.Provider>
  );
};
