import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  kod?: string; // Product Code
  supplier: string; // Supplier Name
  supplierDetails?: { // Full Supplier Info
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
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('savedProducts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load products:', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('savedProducts', JSON.stringify(products));
  }, [products]);

  const addProduct = (newProductData: Omit<Product, 'id'>) => {
    // Check if product with same name AND supplier exists to avoid duplicates
    // We update the existing one with new details if it exists
    const existingIndex = products.findIndex(
      p => p.name.toLowerCase() === newProductData.name.toLowerCase() && 
           p.supplier.toLowerCase() === newProductData.supplier.toLowerCase()
    );

    if (existingIndex !== -1) {
        // Update existing
        setProducts(prev => {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...newProductData };
            return updated;
        });
    } else {
      const newProduct = { ...newProductData, id: Date.now().toString() };
      setProducts(prev => [...prev, newProduct]);
    }
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
};