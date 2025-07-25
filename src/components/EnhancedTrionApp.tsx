import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Components
import HeroSection from './HeroSection';
import SmartSearch from './SmartSearch';
import ProductRecommendations from './ProductRecommendations';
import BrandFeatures from './BrandFeatures';

// Import multiple product images for better showcase
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  size?: string[];
  color?: string[];
  material?: string;
  gender?: string;
  brand?: string;
  rating?: number;
  discount?: number;
  images?: string[]; // Multiple images for product details
}

interface CartItem extends Product {
  quantity: number;
}

const EnhancedTrionApp: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [currentSearchPrompt, setCurrentSearchPrompt] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Authentication state
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  // Authentication setup
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile if logged in
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generate enhanced product data
  useEffect(() => {
    const generateEnhancedProducts = () => {
      const categories = [
        { name: 'T-Shirts', items: ['Cotton T-Shirt', 'Polo T-Shirt', 'Graphic T-Shirt', 'V-Neck T-Shirt'] },
        { name: 'Shirts', items: ['Formal Shirt', 'Casual Shirt', 'Denim Shirt', 'Flannel Shirt'] },
        { name: 'Hoodies', items: ['Pullover Hoodie', 'Zip Hoodie', 'Oversized Hoodie', 'Sports Hoodie'] },
        { name: 'Dresses', items: ['Summer Dress', 'Evening Dress', 'Casual Dress', 'Formal Dress'] },
        { name: 'Pants', items: ['Formal Pants', 'Casual Pants', 'Chinos', 'Track Pants'] },
        { name: 'Jeans', items: ['Slim Fit Jeans', 'Regular Jeans', 'Skinny Jeans', 'Wide Leg Jeans'] },
        { name: 'Shorts', items: ['Gym Shorts', 'Casual Shorts', 'Denim Shorts', 'Cargo Shorts'] },
        { name: 'Shoes', items: ['Running Shoes', 'Casual Shoes', 'Formal Shoes', 'Boots'] },
        { name: 'Sneakers', items: ['Basketball Sneakers', 'Lifestyle Sneakers', 'Running Sneakers', 'Retro Sneakers'] },
        { name: 'Glasses', items: ['Sunglasses', 'Reading Glasses', 'Fashion Glasses', 'Sports Glasses'] },
        { name: 'Watches', items: ['Sport Watch', 'Dress Watch', 'Smart Watch', 'Casual Watch'] },
        { name: 'Bags', items: ['Backpack', 'Handbag', 'Tote Bag', 'Crossbody Bag'] }
      ];

      const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy'];
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const materials = ['Cotton', 'Polyester', 'Wool', 'Silk', 'Denim', 'Leather'];
      const genders = ['Men', 'Women', 'Unisex'];
      const brands = ['TRION', 'StyleCraft', 'UrbanWear', 'ClassicFit', 'ModernEdge'];

      const newProducts: Product[] = [];
      let productId = 1;

      categories.forEach(category => {
        category.items.forEach(item => {
          for (let variant = 1; variant <= 3; variant++) {
            const randomColors = colors.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
            const randomSizes = sizes.slice(0, Math.floor(Math.random() * 4) + 2);
            const material = materials[Math.floor(Math.random() * materials.length)];
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const basePrice = Math.floor(Math.random() * (4999 - 599 + 1)) + 599;
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : undefined;
            const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars

            newProducts.push({
              id: productId++,
              name: `${brand} ${item} #${variant}`,
              price: basePrice,
              image: placeholderImage,
              images: [placeholderImage, placeholderImage, placeholderImage], // Front, side, back views
              category: category.name,
              description: `Premium ${material.toLowerCase()} ${item.toLowerCase()} designed for comfort and style. Perfect for ${gender.toLowerCase()} who appreciate quality fashion.`,
              size: randomSizes,
              color: randomColors,
              material,
              gender: gender.toLowerCase(),
              brand,
              rating,
              discount
            });
          }
        });
      });

      setProducts(newProducts);
      setFilteredProducts(newProducts);
      setIsLoading(false);
    };

    // Simulate loading time
    setTimeout(generateEnhancedProducts, 1500);
  }, []);

  // Cart functionality
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

  const removeFromCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => prev.filter(item => item.id !== productId));
    toast({
      title: "Removed from Cart",
      description: `${product.name} removed from cart`,
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  // Search functionality
  const handleSearch = (searchedProducts: Product[]) => {
    setFilteredProducts(searchedProducts);
    setShowRecommendations(searchedProducts.length === products.length);
  };

  const handlePromptSearch = (prompt: string) => {
    setCurrentSearchPrompt(prompt);
    setShowRecommendations(false);
  };

  // Category filtering logic
  const filterProductsByCategory = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    
    return products.filter(product => {
      switch (selectedCategory) {
        case 'MEN':
          return product.gender === 'men' || 
                 ['T-Shirts', 'Shirts', 'Hoodies', 'Pants', 'Jeans', 'Shorts', 'Shoes', 'Sneakers', 'Watches'].includes(product.category);
        case 'WOMEN':
          return product.gender === 'women' || 
                 ['Dresses', 'T-Shirts', 'Jeans', 'Pants', 'Watches', 'Glasses', 'Shorts', 'Bags'].includes(product.category);
        case 'GEN Z':
          return product.name.toLowerCase().includes('graphic') || 
                 product.name.toLowerCase().includes('oversized') ||
                 product.name.toLowerCase().includes('lifestyle') ||
                 product.category === 'T-Shirts' ||
                 product.category === 'Hoodies' ||
                 product.category === 'Sneakers';
        case 'BRANDS':
          return ['TRION', 'StyleCraft', 'UrbanWear', 'ClassicFit', 'ModernEdge'].includes(product.brand || '');
        default:
          return true;
      }
    });
  }, [products, selectedCategory]);

  // Update filtered products when category changes
  useEffect(() => {
    if (showRecommendations) {
      setFilteredProducts(filterProductsByCategory);
    }
  }, [filterProductsByCategory, showRecommendations]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowRecommendations(true);
    setCurrentSearchPrompt('');
    setIsMobileMenuOpen(false);
  };

  // Cart calculations
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.discount 
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;
    return sum + (price * item.quantity);
  }, 0);

  const checkout = () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login or sign up to complete your order",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    toast({
      title: "Order Placed Successfully!",
      description: `Thank you for your order of ₹${cartTotal.toLocaleString()}`,
    });
    setCart([]);
    setIsCartOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="trion-spinner mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold text-foreground mb-2">TRION</h2>
          <p className="text-muted-foreground">Loading your fashion experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        className="bg-card shadow-sm border-b border-border sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.h1 
              className="text-3xl font-bold text-primary cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedCategory('ALL');
                setShowRecommendations(true);
                setCurrentSearchPrompt('');
              }}
            >
              TRION
            </motion.h1>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-full"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {/* Navigation Menu */}
              <nav className="flex items-center gap-1">
                {['ALL', 'MEN', 'WOMEN', 'GEN Z', 'BRANDS'].map((category) => (
                  <motion.button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category}
                  </motion.button>
                ))}
              </nav>

              {/* Auth/Profile Section */}
              {user ? (
                <div className="relative group">
                  <motion.div
                    className="flex flex-col items-center cursor-pointer p-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Profile Picture */}
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mb-1">
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    {/* Name */}
                    <span className="text-xs font-medium text-foreground truncate max-w-20">
                      {userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    {/* Profile Label */}
                    <span className="text-xs text-muted-foreground">Profile</span>
                  </motion.div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        Admin Panel
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={() => navigate('/auth')}
                  className="px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Login
                </motion.button>
              )}
              {/* Cart Button */}
              <motion.button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 hover:bg-muted rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="md:hidden mt-4 pb-4 border-t border-border"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <nav className="flex flex-col gap-4 pt-4">
                  {/* Category Navigation */}
                  {['ALL', 'MEN', 'WOMEN', 'GEN Z', 'BRANDS'].map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`text-left px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="flex items-center gap-2 text-left text-foreground hover:text-primary transition-colors"
                    >
                      <ShoppingCart size={20} />
                      Cart ({cartItemCount})
                    </button>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <main>
        {/* Hero Section with Overlay Search */}
        {showRecommendations && (
          <HeroSection 
            searchComponent={
              <SmartSearch
                products={products}
                onSearch={handleSearch}
                onPromptSearch={handlePromptSearch}
              />
            }
          />
        )}

        {/* Search Bar for non-hero view */}
        {!showRecommendations && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <SmartSearch
              products={products}
              onSearch={handleSearch}
              onPromptSearch={handlePromptSearch}
            />
          </div>
        )}

        {/* Content based on search state */}
        {showRecommendations ? (
          /* Recommendation Engine */
          <ProductRecommendations
            products={filteredProducts}
            onAddToCart={addToCart}
            onViewDetails={(id) => navigate(`/product/${id}`)}
          />
        ) : (
          /* Search Results */
          <div className="max-w-7xl mx-auto px-4 pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Search Results Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {currentSearchPrompt ? `Results for "${currentSearchPrompt}"` : 'Filtered Products'}
                </h2>
                <p className="text-muted-foreground">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setShowRecommendations(true);
                      setCurrentSearchPrompt('');
                    }}
                    className="trion-btn"
                  >
                    Browse All Products
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      className="trion-card group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Discount Badge */}
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                          -{product.discount}%
                        </div>
                      )}

                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-md mb-3 group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground truncate">{product.name}</h4>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            ₹{product.discount 
                              ? Math.round(product.price * (1 - product.discount / 100)).toLocaleString()
                              : product.price.toLocaleString()
                            }
                          </span>
                          {product.discount && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{product.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${product.id}`);
                            }}
                            className="trion-btn flex-1 text-sm"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product.id);
                            }}
                            className="trion-btn-secondary trion-btn flex-1 text-sm"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Brand Features Section */}
        <BrandFeatures />
      </main>

      {/* Cart Slide-out */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-xl overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Shopping Cart</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-muted rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map(item => {
                        const price = item.discount 
                          ? Math.round(item.price * (1 - item.discount / 100))
                          : item.price;
                        return (
                          <div key={item.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">₹{price.toLocaleString()}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total ({cartItemCount} items):</span>
                        <span className="text-xl font-bold text-primary">₹{cartTotal.toLocaleString()}</span>
                      </div>
                      <motion.button
                        onClick={checkout}
                        className="w-full trion-btn py-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Checkout
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedTrionApp;