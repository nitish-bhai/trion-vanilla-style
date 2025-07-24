import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

const TrionApp = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Generate products on mount
  useEffect(() => {
    const generateProducts = () => {
      const categories = ['Streetwear', 'Formal', 'Casual', 'Luxury', 'Sportswear'];
      const baseNames = ['Jacket', 'Hoodie', 'Shirt', 'Dress', 'Pants', 'Sneakers', 'Boots', 'Accessories'];
      
      const newProducts: Product[] = [];
      for (let i = 1; i <= 100; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
        newProducts.push({
          id: i,
          name: `${category} ${baseName} #${i}`,
          price: Math.floor(Math.random() * (2999 - 499 + 1)) + 499,
          image: placeholderImage,
          category,
          description: `Premium ${category.toLowerCase()} ${baseName.toLowerCase()} crafted with attention to detail and modern design.`
        });
      }
      setProducts(newProducts);
      setIsLoading(false);
    };

    setTimeout(generateProducts, 1000); // Simulate loading
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem) {
        toast({
          title: "Updated Cart",
          description: `Increased quantity of ${product.name}`,
        });
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Added to Cart",
          description: `${product.name} added to your cart`,
        });
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const openTryOn = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setModalContent(
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-slate-800">Virtual Try-On</h3>
        <div className="mb-6">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
          />
        </div>
        <h4 className="text-xl font-medium mb-2">{product.name}</h4>
        <p className="text-gray-600 mb-6">{product.description}</p>
        <div className="flex gap-3 justify-center">
          <button 
            className="trion-btn"
            onClick={() => {
              addToCart(productId);
              setIsModalOpen(false);
            }}
          >
            Add to Cart - ₹{product.price}
          </button>
          <button 
            className="trion-btn-secondary trion-btn"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
    setIsModalOpen(true);
  };

  const openCart = () => {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    setModalContent(
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-slate-800">Shopping Cart</h3>
        {cart.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <p className="text-gray-600 text-sm">₹{item.price} × {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));
                      toast({
                        title: "Removed from Cart",
                        description: `${item.name} removed from cart`,
                      });
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total ({totalItems} items):</span>
                <span className="text-xl font-bold text-teal-600">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button 
                  className="trion-btn flex-1"
                  onClick={() => {
                    toast({
                      title: "Order Placed!",
                      description: `Thank you for your order of ₹${totalPrice.toLocaleString()}`,
                    });
                    setCart([]);
                    setIsModalOpen(false);
                  }}
                >
                  Checkout
                </button>
                <button 
                  className="trion-btn-secondary trion-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
    setIsModalOpen(true);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">TRION</h1>
            
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search TRION..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="trion-search"
              />
            </div>
            
            <button
              onClick={openCart}
              className="relative p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-2xl">🛒</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="trion-spinner mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading TRION collection...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="px-4 py-4">
              <p className="text-muted-foreground">
                {searchTerm ? `${filteredProducts.length} results for "${searchTerm}"` : `${products.length} products`}
              </p>
            </div>

            {/* Product Grid */}
            <section className="trion-grid">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-xl text-muted-foreground italic">No products found</p>
                  <p className="text-muted-foreground mt-2">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="trion-card">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="trion-loading"
                    />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-800 truncate">{product.name}</h4>
                      <p className="text-xl font-bold text-teal-600">₹{product.price.toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addToCart(product.id)}
                          className="trion-btn flex-1 text-sm"
                        >
                          Add to Cart
                        </button>
                        <button 
                          onClick={() => openTryOn(product.id)}
                          className="trion-btn-secondary trion-btn flex-1 text-sm"
                        >
                          Try On
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className={`trion-modal-overlay ${isModalOpen ? 'active' : ''}`}>
          <div className="trion-modal">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-2xl hover:text-gray-600 transition-colors"
            >
              ×
            </button>
            {modalContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrionApp;