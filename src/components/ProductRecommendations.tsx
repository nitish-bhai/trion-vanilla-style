import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingCart } from 'lucide-react';

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

interface RecommendationProps {
  products: Product[];
  onAddToCart: (productId: number) => void;
  onViewDetails: (productId: number) => void;
  userPreferences?: {
    browsingHistory: string[];
    purchaseHistory: string[];
    savedItems: number[];
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

  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    generateRecommendations();
  }, [products, userPreferences]);

  const generateRecommendations = () => {
    // Ensure we have products before generating recommendations
    if (!products || products.length === 0) {
      console.log('No products available for recommendations');
      return;
    }

    // Simulate trending products (highest rated or most popular)
    const trending = products
      .filter(product => product.rating && product.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12); // Increased to 12 products

    // Generate personalized recommendations based on user preferences
    const forYou = products
      .filter(product => {
        const categoryMatch = userPreferences.preferredCategories.some(cat => 
          product.category.toLowerCase().includes(cat) || 
          product.name.toLowerCase().includes(cat)
        );
        const colorMatch = userPreferences.preferredColors.some(color =>
          product.name.toLowerCase().includes(color) ||
          (product.color && product.color.some(c => c.toLowerCase().includes(color)))
        );
        return categoryMatch || colorMatch;
      })
      .slice(0, 12); // Increased to 12 products

    // Similar to browsing history
    const similarToViewed = products
      .filter(product => {
        return userPreferences.browsingHistory.some(item =>
          product.category.toLowerCase().includes(item) ||
          product.name.toLowerCase().includes(item)
        );
      })
      .slice(0, 12); // Increased to 12 products

    // New arrivals (simulate with recent products - last 12)
    const newArrivals = products
      .slice(-12)
      .reverse(); // Show newest first

    console.log('Generated recommendations:', { trending: trending.length, forYou: forYou.length, similarToViewed: similarToViewed.length, newArrivals: newArrivals.length });

    setRecommendations({
      trending,
      forYou,
      similarToViewed,
      newArrivals
    });
  };

  const toggleLike = (productId: number) => {
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
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => (
    <motion.div
      className="trion-card group cursor-pointer relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Discount Badge */}
      {product.discount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
          -{product.discount}%
        </div>
      )}

      {/* Like Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(product.id);
        }}
        className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-all z-10"
      >
        <Heart
          size={16}
          className={`${likedItems.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
        />
      </button>

      <div onClick={() => onViewDetails(product.id)}>
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover rounded-md mb-3 group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground truncate">{product.name}</h4>
          
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
            </div>
          )}
          
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

          {/* Colors */}
          {product.color && (
            <div className="flex gap-1">
              {product.color.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.color.length > 4 && (
                <span className="text-xs text-muted-foreground">+{product.color.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add to Cart */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(product.id);
        }}
        className="w-full mt-3 trion-btn-secondary trion-btn text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ShoppingCart size={16} />
        Quick Add
      </motion.button>
    </motion.div>
  );

  const RecommendationSection: React.FC<{ 
    title: string; 
    products: Product[]; 
    subtitle?: string;
    gradient?: string;
  }> = ({ title, products, subtitle, gradient = "from-primary/10 to-primary/5" }) => (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={`bg-gradient-to-r ${gradient} rounded-lg p-6 mb-6`}>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </motion.section>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">Discover Your Style</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Personalized recommendations based on your style preferences and shopping behavior
        </p>
      </motion.div>

      {/* Special Offers Banner */}
      <motion.div
        className="bg-gradient-to-r from-red-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl p-8 mb-12 border border-red-200/50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            🔥 Limited Time Offer
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Flash Sale - Up to 70% OFF</h2>
          <p className="text-muted-foreground mb-6">Get the best deals on premium fashion items. Sale ends in 24 hours!</p>
          <div className="flex justify-center gap-4 text-center">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 min-w-16">
              <div className="text-2xl font-bold text-red-600">23</div>
              <div className="text-xs text-muted-foreground">HOURS</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 min-w-16">
              <div className="text-2xl font-bold text-red-600">45</div>
              <div className="text-xs text-muted-foreground">MINS</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 min-w-16">
              <div className="text-2xl font-bold text-red-600">12</div>
              <div className="text-xs text-muted-foreground">SECS</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Categories */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'T-Shirts', emoji: '👕', discount: '30% OFF' },
            { name: 'Hoodies', emoji: '🧥', discount: '25% OFF' },
            { name: 'Jeans', emoji: '👖', discount: '40% OFF' },
            { name: 'Dresses', emoji: '👗', discount: '35% OFF' },
            { name: 'Sneakers', emoji: '👟', discount: '20% OFF' },
            { name: 'Watches', emoji: '⌚', discount: '50% OFF' }
          ].map((category, index) => (
            <motion.div
              key={category.name}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-lg transition-all cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{category.emoji}</div>
              <h3 className="font-semibold text-sm text-foreground mb-1">{category.name}</h3>
              <div className="text-xs text-primary font-bold">{category.discount}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hot Deals */}
      {recommendations.trending.length > 0 ? (
        <RecommendationSection
          title="🔥 Hot Deals & Trending"
          subtitle="Most popular items with amazing discounts"
          products={recommendations.trending}
          gradient="from-primary/20 to-primary/10"
        />
      ) : (
        <div className="mb-12 text-center py-8">
          <div className="animate-pulse">
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <div className="h-8 bg-primary/20 rounded w-64 mx-auto mb-2"></div>
              <div className="h-4 bg-primary/10 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-primary/5 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {recommendations.forYou.length > 0 ? (
        <RecommendationSection
          title="✨ Recommended For You"
          subtitle="Curated based on your preferences and browsing history"
          products={recommendations.forYou}
          gradient="from-primary/15 to-primary/5"
        />
      ) : (
        <div className="mb-12 text-center py-8">
          <div className="animate-pulse">
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <div className="h-8 bg-primary/20 rounded w-64 mx-auto mb-2"></div>
              <div className="h-4 bg-primary/10 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-primary/5 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Special Offers */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="bg-gradient-to-r from-green-100 to-emerald-50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">💫 Today's Special Offers</h2>
          <p className="text-muted-foreground">Limited time deals you don't want to miss</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buy 2 Get 1 Free */}
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 text-center border border-blue-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Buy 2 Get 1 FREE</h3>
            <p className="text-muted-foreground text-sm mb-4">On all casual wear items</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
              Shop Now
            </button>
          </motion.div>

          {/* Free Shipping */}
          <motion.div
            className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 text-center border border-purple-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="text-xl font-bold text-foreground mb-2">FREE Shipping</h3>
            <p className="text-muted-foreground text-sm mb-4">On orders above ₹999</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors">
              Explore
            </button>
          </motion.div>

          {/* Extra Discount */}
          <motion.div
            className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-6 text-center border border-yellow-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-4xl mb-3">💸</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Extra 15% OFF</h3>
            <p className="text-muted-foreground text-sm mb-4">Use code: TRION15</p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-700 transition-colors">
              Copy Code
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Similar to Viewed */}
      {recommendations.similarToViewed.length > 0 ? (
        <RecommendationSection
          title="👀 Similar to What You've Viewed"
          subtitle="More items like your recent interests"
          products={recommendations.similarToViewed}
          gradient="from-primary/10 to-primary/5"
        />
      ) : (
        <div className="mb-12 text-center py-8">
          <div className="animate-pulse">
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <div className="h-8 bg-primary/20 rounded w-64 mx-auto mb-2"></div>
              <div className="h-4 bg-primary/10 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-primary/5 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {recommendations.newArrivals.length > 0 ? (
        <RecommendationSection
          title="🆕 New Arrivals"
          subtitle="Fresh styles just in - be the first to own them"
          products={recommendations.newArrivals}
          gradient="from-primary/8 to-primary/3"
        />
      ) : (
        <div className="mb-12 text-center py-8">
          <div className="animate-pulse">
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <div className="h-8 bg-primary/20 rounded w-64 mx-auto mb-2"></div>
              <div className="h-4 bg-primary/10 rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-primary/5 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Brands */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">🏆 Featured Brands</h2>
          <p className="text-muted-foreground">Shop from our premium brand partners</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {['TRION', 'StyleCraft', 'UrbanWear', 'ClassicFit', 'ModernEdge'].map((brand, index) => (
            <motion.div
              key={brand}
              className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-primary font-bold text-lg">{brand[0]}</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground">{brand}</h3>
              <p className="text-xs text-muted-foreground">Up to 60% OFF</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom Call-to-Action */}
      <motion.div
        className="text-center py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <h2 className="text-3xl font-bold text-foreground mb-4">Can't Find What You're Looking For?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Try our smart search or browse all categories to discover more amazing products
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
            Browse All Products
          </button>
          <button className="border border-primary text-primary px-8 py-3 rounded-full font-medium hover:bg-primary/10 transition-colors">
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductRecommendations;