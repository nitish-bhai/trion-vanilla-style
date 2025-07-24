import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hf_api_key') || '');
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('hf_api_key', apiKey);
    } else {
      localStorage.removeItem('hf_api_key');
    }
  }, [apiKey]);

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

  // Convert image file to base64
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove data:image/... prefix
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Call Hugging Face Virtual Try-On API
  const callTryOnAPI = async (userImageFile: File, product: Product) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Hugging Face API key to use virtual try-on",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingTryOn(true);
    
    try {
      // Convert user image to base64
      const userImageBase64 = await imageToBase64(userImageFile);
      
      const response = await fetch(
        'https://api-inference.huggingface.co/models/Kwai-Kolors/Kolors-Virtual-Try-On',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_user: userImageBase64,
            image_garment: product.image
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const tryOnImageUrl = URL.createObjectURL(blob);

      // Show result in modal
      setModalContent(
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4 text-slate-800">Virtual Try-On Result</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Original</p>
              <img 
                src={URL.createObjectURL(userImageFile)} 
                alt="Original"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Try-On Result</p>
              <img 
                src={tryOnImageUrl} 
                alt="Try-On Result"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
          <h4 className="text-xl font-medium mb-2">{product.name}</h4>
          <p className="text-gray-600 mb-6">₹{product.price.toLocaleString()}</p>
          <div className="flex gap-3 justify-center">
            <button 
              className="trion-btn"
              onClick={() => {
                addToCart(product.id);
                setIsModalOpen(false);
              }}
            >
              Buy Now - ₹{product.price}
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

      toast({
        title: "Try-On Complete!",
        description: "Your virtual try-on result is ready",
      });

    } catch (error) {
      console.error('Try-on error:', error);
      toast({
        title: "Try-On Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingTryOn(false);
    }
  };

  const openTryOn = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setModalContent(
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-4 text-slate-800">Virtual Try-On</h3>
        
        {/* API Key Input */}
        {!apiKey && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              Enter your Hugging Face API key to use virtual try-on
            </p>
            <input
              type="password"
              placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              Get your API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Hugging Face</a>
            </p>
          </div>
        )}

        <div className="mb-6">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
          />
        </div>
        
        <h4 className="text-xl font-medium mb-2">{product.name}</h4>
        <p className="text-gray-600 mb-6">{product.description}</p>
        
        {/* Upload Image for Try-On */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && apiKey) {
                callTryOnAPI(file, product);
              }
            }}
            className="hidden"
          />
          <button 
            className="trion-btn mb-3"
            onClick={() => fileInputRef.current?.click()}
            disabled={!apiKey || isProcessingTryOn}
          >
            {isProcessingTryOn ? (
              <>
                <div className="trion-spinner inline-block mr-2"></div>
                Processing...
              </>
            ) : (
              'Upload Photo & Try On'
            )}
          </button>
          <p className="text-xs text-gray-600">
            Upload a photo of yourself to see how this item looks on you
          </p>
        </div>

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