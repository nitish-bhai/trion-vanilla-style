import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingCart } from 'lucide-react';
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
}
interface RecommendationProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onViewDetails: (productId: string) => void;
  userPreferences?: {
    browsingHistory: string[];
    purchaseHistory: string[];
    savedItems: string[];
    preferredSizes: string[];
    preferredColors: string[];
    preferredCategories: string[];
  };
}
const ProductRecommendations: React.FC<RecommendationProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  userPreferences = {
    browsingHistory: ['casual', 'streetwear'],
    purchaseHistory: ['t-shirt', 'hoodie'],
    savedItems: [],
    preferredSizes: ['M', 'L'],
    preferredColors: ['black', 'white', 'blue'],
    preferredCategories: ['casual', 'streetwear', 'formal']
  }
}) => {
  const [recommendations, setRecommendations] = useState<{
    trending: Product[];
    forYou: Product[];
    similarToViewed: Product[];
    newArrivals: Product[];
  }>({
    trending: [],
    forYou: [],
    similarToViewed: [],
    newArrivals: []
  });
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (products.length > 0) {
      generateRecommendations();
    }
  }, [products]);
  const generateRecommendations = () => {
    if (products.length === 0) return;

    // Create copies to avoid mutating original array
    const productsCopy = [...products];
    
    // Simulate trending products (highest rated or most popular)
    const trending = productsCopy
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);

    // Generate personalized recommendations based on user preferences
    const forYou = productsCopy.filter(product => {
      const categoryMatch = userPreferences.preferredCategories.some(cat => 
        product.category.toLowerCase().includes(cat) || 
        product.name.toLowerCase().includes(cat)
      );
      const colorMatch = userPreferences.preferredColors.some(color => 
        product.name.toLowerCase().includes(color) || 
        (product.color && Array.isArray(product.color) && product.color.some(c => c.toLowerCase().includes(color)))
      );
      return categoryMatch || colorMatch;
    }).slice(0, 12);

    // Similar to browsing history
    const similarToViewed = productsCopy.filter(product => {
      return userPreferences.browsingHistory.some(item => 
        product.category.toLowerCase().includes(item) || 
        product.name.toLowerCase().includes(item)
      );
    }).slice(0, 12);

    // New arrivals (simulate with random selection but deterministic)
    const shuffled = productsCopy.sort((a, b) => a.id.localeCompare(b.id));
    const newArrivals = shuffled.slice(0, 12);
    
    setRecommendations({
      trending,
      forYou,
      similarToViewed,
      newArrivals
    });
  };
  const toggleLike = (productId: string) => {
    setLikedItems(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(productId)) {
        newLiked.delete(productId);
      } else {
        newLiked.add(productId);
      }
      return newLiked;
    });
  };
  const renderStars = (rating: number) => {
    return Array.from({
      length: 5
    }, (_, i) => <Star key={i} size={16} className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />);
  };
  const ProductCard: React.FC<{
    product: Product;
    index: number;
  }> = ({
    product,
    index
  }) => <motion.div className="trion-card group cursor-pointer relative overflow-hidden" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5,
    delay: index * 0.1
  }} whileHover={{
    scale: 1.02
  }}>
      {/* Discount Badge */}
      {product.discount}

      {/* Like Button */}
      <button onClick={e => {
      e.stopPropagation();
      toggleLike(product.id);
    }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-all z-10">
        <Heart size={16} className={`${likedItems.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      </button>

      <div onClick={() => onViewDetails(product.id)}>
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-md mb-3 group-hover:scale-105 transition-transform duration-300" />
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground truncate">{product.name}</h4>
          
          {/* Rating */}
          {product.rating && <div className="flex items-center gap-1">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
            </div>}
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              ₹{product.discount ? Math.round(product.price * (1 - product.discount / 100)).toLocaleString() : product.price.toLocaleString()}
            </span>
            {product.discount && <span className="text-sm text-muted-foreground line-through">
                ₹{product.price.toLocaleString()}
              </span>}
          </div>

          {/* Colors */}
          {product.color && Array.isArray(product.color) && <div className="flex gap-1">
              {product.color.slice(0, 4).map((color, idx) => <div key={idx} className="w-4 h-4 rounded-full border border-gray-300" style={{
            backgroundColor: color.toLowerCase()
          }} title={color} />)}
              {product.color.length > 4 && <span className="text-xs text-muted-foreground">+{product.color.length - 4}</span>}
            </div>}
        </div>
      </div>

      {/* Quick Add to Cart */}
      <motion.button onClick={e => {
      e.stopPropagation();
      onAddToCart(product.id);
    }} className="w-full mt-3 trion-btn-secondary trion-btn text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" whileHover={{
      scale: 1.02
    }} whileTap={{
      scale: 0.98
    }}>
        <ShoppingCart size={16} />
        Quick Add
      </motion.button>
    </motion.div>;
  const RecommendationSection: React.FC<{
    title: string;
    products: Product[];
    subtitle?: string;
    gradient?: string;
  }> = ({
    title,
    products,
    subtitle,
    gradient = "from-primary/10 to-primary/5"
  }) => <motion.section className="mb-12" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.6
  }}>
      <div className={`bg-gradient-to-r ${gradient} rounded-lg p-6 mb-6`}>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
      </div>
    </motion.section>;
    // Show loading skeleton if products are not loaded yet
    if (products.length === 0) {
      return <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-48 rounded-md mb-3"></div>
              <div className="bg-muted h-4 rounded mb-2"></div>
              <div className="bg-muted h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>;
    }

    return <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Discover Your Style</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Personalized recommendations based on your style preferences and shopping behavior
        </p>
      </motion.div>

      {/* Personalized Recommendations */}
      <RecommendationSection title="Recommended For You" subtitle="Curated based on your preferences and browsing history" products={recommendations.forYou} gradient="from-primary/15 to-primary/5" />

      {/* Trending Products */}
      <RecommendationSection title="Trending Now" subtitle="What everyone's talking about" products={recommendations.trending} gradient="from-primary/10 to-accent/5" />

      {/* Similar to Viewed */}
      <RecommendationSection title="Similar to What You've Viewed" subtitle="More items like your recent interests" products={recommendations.similarToViewed} gradient="from-accent/10 to-primary/5" />

      {/* New Arrivals */}
      <RecommendationSection title="New Arrivals" subtitle="Fresh styles just in" products={recommendations.newArrivals} gradient="from-primary/5 to-accent/10" />
    </div>;
};
export default ProductRecommendations;