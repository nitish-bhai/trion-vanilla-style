import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, LogOut, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useCart } from '@/contexts/CartContext';

// Components
import HeroSection from './HeroSection';
import ProductRecommendations from './ProductRecommendations';
import BrandFeatures from './BrandFeatures';
import ExpandableSearch from './ExpandableSearch';
import FilterSidebar from './FilterSidebar';

// Import multiple product images for better showcase
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: string;
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
  images?: string[];
  stock?: number;
  discount_percentage?: number;
  is_trending?: boolean;
}

const EnhancedTrionApp: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, addToCart: addToCartContext, removeFromCart, updateCartQuantity, cartItemCount, cartTotal, clearCart } = useCart();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [currentSearchPrompt, setCurrentSearchPrompt] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeFilters, setActiveFilters] = useState<any>({
    maxPrice: 10000,
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    genders: [],
    brands: [],
    ratings: []
  });
  
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

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('products-store-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database products to match the frontend format
      const transformedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: (product.images as string[] | null)?.[0] || placeholderImage,
        images: (product.images as string[] | null) || [placeholderImage],
        category: product.category,
        description: product.description || '',
        size: (product.sizes as string[] | null) || [],
        color: typeof product.color === 'string' && product.color 
          ? product.color.split(',').map(c => c.trim()).filter(Boolean) 
          : (product.color as unknown as string[] | null) || undefined,
        material: product.material || undefined,
        gender: product.gender || undefined,
        brand: product.brand,
        rating: product.rating || 4,
        discount: product.discount_percentage || undefined,
        stock: product.stock,
        discount_percentage: product.discount_percentage,
        is_trending: product.is_trending
      }));

      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper for addToCart to match existing signature
  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCartContext(product);
    }
  };

  // Search functionality
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      setShowRecommendations(true);
      setCurrentSearchPrompt('');
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery) ||
      product.brand.toLowerCase().includes(searchQuery) ||
      product.description?.toLowerCase().includes(searchQuery)
    );

    setFilteredProducts(filtered);
    setShowRecommendations(false);
    setCurrentSearchPrompt(query);
  };

  const handlePromptSearch = (prompt: string) => {
    setCurrentSearchPrompt(prompt);
    handleSearch(prompt);
  };

  // Filter functionality
  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    applyFilters(filters);
  };

  const applyFilters = (filters: any) => {
    let filtered = [...products];

    // Apply price filter
    filtered = filtered.filter(product => 
      product.price <= filters.maxPrice
    );

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        filters.categories.some((cat: string) => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Apply gender filter
    if (filters.genders.length > 0) {
      filtered = filtered.filter(product =>
        product.gender && filters.genders.some((g: string) =>
          product.gender?.toLowerCase() === g.toLowerCase()
        )
      );
    }

    // Apply size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(product =>
        product.size && product.size.some((s: string) =>
          filters.sizes.includes(s)
        )
      );
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter(product =>
        product.color && product.color.some((c: string) =>
          filters.colors.includes(c)
        )
      );
    }

    // Apply material filter
    if (filters.materials.length > 0) {
      filtered = filtered.filter(product =>
        product.material && filters.materials.some((m: string) =>
          product.material?.toLowerCase().includes(m.toLowerCase())
        )
      );
    }

    // Apply brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter(product =>
        filters.brands.includes(product.brand)
      );
    }

    // Apply rating filter
    if (filters.ratings.length > 0) {
      const minRating = Math.min(...filters.ratings);
      filtered = filtered.filter(product =>
        (product.rating || 0) >= minRating
      );
    }

    setFilteredProducts(filtered);
    setShowRecommendations(false);
  };

  // Extract available filters from products
  const availableFilters = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    const sizes = [...new Set(products.flatMap(p => p.size || []))].filter(Boolean);
    const colors = [...new Set(products.flatMap(p => p.color || []))].filter(Boolean);
    const materials = [...new Set(products.map(p => p.material).filter(Boolean))];
    const genders = [...new Set(products.map(p => p.gender).filter(Boolean))];
    const brands = [...new Set(products.map(p => p.brand))].filter(Boolean);

    return {
      categories,
      sizes,
      colors,
      materials,
      genders,
      brands
    };
  }, [products]);

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
    clearCart();
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
            <div className="md:hidden flex items-center gap-2">
              <ExpandableSearch
                onSearch={handleSearch}
                onPromptSearch={handlePromptSearch}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-muted rounded-full"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

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

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setIsFilterOpen(true)}
                  className="p-3 hover:bg-muted rounded-full transition-colors relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Filters"
                >
                  <SlidersHorizontal size={24} className="text-foreground" />
                  {(activeFilters.categories.length > 0 || 
                    activeFilters.sizes.length > 0 || 
                    activeFilters.colors.length > 0 ||
                    activeFilters.brands.length > 0 ||
                    activeFilters.materials.length > 0 ||
                    activeFilters.genders.length > 0 ||
                    activeFilters.ratings.length > 0) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </motion.button>

                <ExpandableSearch
                  onSearch={handleSearch}
                  onPromptSearch={handlePromptSearch}
                />
              </div>

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
                  {/* Search & Filter Buttons */}
                  <div className="flex gap-2 px-4">
                    <button
                      onClick={() => {
                        setIsFilterOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors"
                    >
                      <SlidersHorizontal size={18} />
                      Filters
                      {(activeFilters.categories.length > 0 || 
                        activeFilters.sizes.length > 0 || 
                        activeFilters.colors.length > 0) && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  </div>

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
        {/* Hero Section */}
        {showRecommendations && <HeroSection />}

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

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onFilterChange={handleFilterChange}
        availableFilters={availableFilters}
      />
    </div>
  );
};

export default EnhancedTrionApp;