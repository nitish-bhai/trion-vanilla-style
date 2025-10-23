import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  size?: string[];
  color?: string[];
  material?: string;
  gender?: string;
  brand?: string;
  rating?: number;
  discount?: number;
  images?: string[];
  stock?: number;
  discount_percentage?: number;
  is_trending?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.id === product.id && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
      );

      if (existingItem) {
        toast({
          title: "Updated Cart",
          description: `Increased quantity of ${product.name}`,
        });
        return prevCart.map(item =>
          item.id === product.id && 
          item.selectedSize === selectedSize && 
          item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Added to Cart",
          description: `${product.name} added to your cart`,
        });
        return [...prevCart, { 
          ...product, 
          quantity: 1, 
          selectedSize, 
          selectedColor 
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    const product = cart.find(item => item.id === productId);
    if (product) {
      setCart(prev => prev.filter(item => item.id !== productId));
      toast({
        title: "Removed from Cart",
        description: `${product.name} removed from cart`,
      });
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.discount_percentage 
      ? item.price * (1 - item.discount_percentage / 100)
      : item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartItemCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
