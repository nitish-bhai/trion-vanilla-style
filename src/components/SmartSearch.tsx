import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';

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
}

interface SmartSearchProps {
  products: Product[];
  onSearch: (filteredProducts: Product[]) => void;
  onPromptSearch: (prompt: string) => void;
}

interface SearchFilters {
  category: string;
  priceRange: [number, number];
  size: string;
  color: string;
  material: string;
  gender: string;
  brand: string;
  availability: boolean;
  minRating: number;
  hasDiscount: boolean;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ products, onSearch, onPromptSearch }) => {
  const [prompt, setPrompt] = useState('');
  const [isPromptMode, setIsPromptMode] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    priceRange: [0, 5000],
    size: '',
    color: '',
    material: '',
    gender: '',
    brand: '',
    availability: false,
    minRating: 0,
    hasDiscount: false,
  });

  const parsePrompt = (promptText: string) => {
    const lower = promptText.toLowerCase();
    let extractedFilters: Partial<SearchFilters> = {};
    
    // Extract product category
    const categories = ['t-shirt', 'shirt', 'hoodie', 'dress', 'pants', 'jeans', 'shorts', 'shoes', 'sneakers', 'glasses', 'watch', 'bag'];
    for (const cat of categories) {
      if (lower.includes(cat)) {
        extractedFilters.category = cat;
        break;
      }
    }
    
    // Extract colors
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'navy'];
    for (const color of colors) {
      if (lower.includes(color)) {
        extractedFilters.color = color;
        break;
      }
    }
    
    // Extract sizes
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
    for (const size of sizes) {
      if (lower.includes(size)) {
        extractedFilters.size = size.toUpperCase();
        break;
      }
    }
    
    // Extract materials
    const materials = ['cotton', 'polyester', 'wool', 'silk', 'denim', 'leather'];
    for (const material of materials) {
      if (lower.includes(material)) {
        extractedFilters.material = material;
        break;
      }
    }
    
    // Extract gender
    if (lower.includes('men') || lower.includes('male')) {
      extractedFilters.gender = 'men';
    } else if (lower.includes('women') || lower.includes('female') || lower.includes('ladies')) {
      extractedFilters.gender = 'women';
    }
    
    // Extract price range
    const priceMatch = lower.match(/under\s*₹?(\d+)|below\s*₹?(\d+)|less\s*than\s*₹?(\d+)/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
      extractedFilters.priceRange = [0, price];
    }
    
    return extractedFilters;
  };

  const filterProducts = (searchFilters: Partial<SearchFilters>) => {
    return products.filter(product => {
      const matchesCategory = !searchFilters.category || 
        product.category.toLowerCase().includes(searchFilters.category) ||
        product.name.toLowerCase().includes(searchFilters.category);
      
      const matchesPrice = !searchFilters.priceRange || 
        (product.price >= searchFilters.priceRange[0] && product.price <= searchFilters.priceRange[1]);
      
      const matchesColor = !searchFilters.color || 
        product.name.toLowerCase().includes(searchFilters.color) ||
        (product.color && product.color.some(c => c.toLowerCase().includes(searchFilters.color!)));
      
      const matchesSize = !searchFilters.size || 
        (product.size && product.size.includes(searchFilters.size));
      
      const matchesMaterial = !searchFilters.material || 
        product.name.toLowerCase().includes(searchFilters.material) ||
        (product.material && product.material.toLowerCase().includes(searchFilters.material));
      
      const matchesGender = !searchFilters.gender || 
        (product.gender && product.gender.toLowerCase() === searchFilters.gender);
      
      return matchesCategory && matchesPrice && matchesColor && matchesSize && matchesMaterial && matchesGender;
    });
  };

  const handlePromptSearch = (searchPrompt: string) => {
    setIsAnimating(true);
    const extractedFilters = parsePrompt(searchPrompt);
    const filteredProducts = filterProducts(extractedFilters);
    
    // Update filters state to show what was extracted
    setFilters(prev => ({ ...prev, ...extractedFilters }));
    
    setTimeout(() => {
      onSearch(filteredProducts);
      onPromptSearch(searchPrompt);
      setIsAnimating(false);
    }, 300);
  };

  const handleManualFilter = () => {
    const filteredProducts = filterProducts(filters);
    onSearch(filteredProducts);
  };

  useEffect(() => {
    if (!isPromptMode) {
      handleManualFilter();
    }
  }, [filters, isPromptMode]);

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: [0, 5000],
      size: '',
      color: '',
      material: '',
      gender: '',
      brand: '',
      availability: false,
      minRating: 0,
      hasDiscount: false,
    });
    setPrompt('');
    onSearch(products);
  };

  return (
    <motion.div 
      className="w-full bg-transparent rounded-lg"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Search Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/30 backdrop-blur-sm rounded-full p-1 flex border border-white/40">
          <button
            onClick={() => setIsPromptMode(true)}
            className={`px-8 py-3 rounded-full transition-all text-base ${
              isPromptMode ? 'bg-white text-black shadow-lg font-semibold' : 'text-white font-medium hover:text-white hover:bg-white/20'
            }`}
          >
            Smart Search
          </button>
          <button
            onClick={() => setIsPromptMode(false)}
            className={`px-8 py-3 rounded-full transition-all text-base ${
              !isPromptMode ? 'bg-white text-black shadow-lg font-semibold' : 'text-white font-medium hover:text-white hover:bg-white/20'
            }`}
          >
            Manual Filter
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPromptMode ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Prompt Search */}
            <div className="relative">
              <div className="relative w-full">
                <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 text-white transition-all ${isAnimating ? 'animate-spin' : ''}`} size={24} />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePromptSearch(prompt)}
                  placeholder="Search for anything... e.g., 'Red cotton t-shirt'"
                  className="w-full pl-16 pr-24 py-5 text-xl border-2 border-white/50 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/80 focus:border-white focus:ring-4 focus:ring-white/30 transition-all font-medium shadow-lg"
                />
                <button
                  onClick={() => handlePromptSearch(prompt)}
                  disabled={!prompt.trim() || isAnimating}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-black px-6 py-2.5 rounded-full text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white/90 shadow-lg"
                >
                  {isAnimating ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              {/* Smart suggestions */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {['Black formal shirt', 'Red cotton t-shirt', 'Blue jeans', 'Summer dresses'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setPrompt(suggestion);
                      handlePromptSearch(suggestion);
                    }}
                    className="px-4 py-2 text-sm bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white font-semibold border border-white/40 rounded-full transition-all shadow-lg hover:shadow-xl"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Manual Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All Categories</option>
                  <option value="t-shirt">T-Shirts</option>
                  <option value="shirt">Shirts</option>
                  <option value="hoodie">Hoodies</option>
                  <option value="dress">Dresses</option>
                  <option value="pants">Pants</option>
                  <option value="jeans">Jeans</option>
                  <option value="shorts">Shorts</option>
                  <option value="shoes">Shoes</option>
                  <option value="sneakers">Sneakers</option>
                  <option value="glasses">Glasses</option>
                  <option value="watch">Watches</option>
                  <option value="bag">Bags</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)] 
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <select
                  value={filters.size}
                  onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All Sizes</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <select
                  value={filters.color}
                  onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All Colors</option>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="pink">Pink</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                  <option value="navy">Navy</option>
                </select>
              </div>
            </div>

            {/* Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Material */}
              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <select
                  value={filters.material}
                  onChange={(e) => setFilters(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All Materials</option>
                  <option value="cotton">Cotton</option>
                  <option value="polyester">Polyester</option>
                  <option value="wool">Wool</option>
                  <option value="silk">Silk</option>
                  <option value="denim">Denim</option>
                  <option value="leather">Leather</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="">All</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="0">All Ratings</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              {/* Discount */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasDiscount}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasDiscount: e.target.checked }))}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">On Sale</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Filters Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full hover:bg-muted transition-all"
        >
          <X size={16} />
          Clear All Filters
        </button>
      </div>
    </motion.div>
  );
};

export default SmartSearch;