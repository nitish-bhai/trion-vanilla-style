import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, Shirt } from 'lucide-react';
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  features: string[];
  colors: string[];
  material: string;
  sizes: string[];
  brand: string;
}

interface Seller {
  id: number;
  name: string;
  storeName: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  joinedDate: string;
}

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart: addToCartContext, cartItemCount } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch the specific product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;

        if (!productData) {
          navigate('/');
          return;
        }

        // Transform to match Product interface
        const transformedProduct: Product = {
          id: productData.id,
          name: productData.name,
          price: productData.price,
          image: (productData.images as string[])?.[0] || placeholderImage,
          category: productData.category,
          description: productData.description || '',
          features: [
            'Premium quality fabric',
            'Modern fit design',
            'Durable construction',
            'Easy care instructions',
            'Versatile styling options'
          ],
          colors: [productData.color],
          material: productData.material || 'Premium Material',
          sizes: (productData.sizes as string[]) || [],
          brand: productData.brand || 'Brand'
        };

        setProduct(transformedProduct);
        setSelectedColor(transformedProduct.colors[0]);
        setSelectedSize(transformedProduct.sizes[0] || '');

        // Mock seller data (can be replaced with actual seller data later)
        const mockSeller: Seller = {
          id: 1,
          name: productData.brand || 'Seller',
          storeName: `${productData.brand || 'Brand'} Store`,
          avatar: placeholderImage,
          rating: 4.5,
          totalReviews: 120,
          joinedDate: '2023'
        };
        setSeller(mockSeller);

        // Mock reviews
        const mockReviews: Review[] = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          userName: `Customer ${i + 1}`,
          rating: Math.floor(Math.random() * 2) + 4,
          comment: [
            'Great quality product, very satisfied!',
            'Perfect fit and excellent material.',
            'Exactly as described, fast delivery.',
            'Love the design and comfort.',
            'Highly recommended seller!',
            'Amazing product, will buy again.',
            'Good value for money.',
            'Excellent customer service.'
          ][i] || 'Great product!',
          date: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
          verified: Math.random() > 0.2
        }));
        setReviews(mockReviews);

        // Fetch similar products from the same category
        const { data: similarData } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .neq('id', id)
          .limit(6);

        if (similarData) {
          const similarProducts: Product[] = similarData.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: (p.images as string[])?.[0] || placeholderImage,
            category: p.category,
            description: p.description || '',
            features: [],
            colors: [p.color],
            material: p.material || '',
            sizes: (p.sizes as string[]) || [],
            brand: p.brand || 'Brand'
          }));
          setSimilarProducts(similarProducts);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error loading product",
          description: "Unable to load product details",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate, toast]);

  const addToCart = () => {
    if (!product) return;
    
    const productForCart = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      color: product.colors,
      material: product.material,
      size: product.sizes
    };
    
    addToCartContext(productForCart, selectedSize, selectedColor);
  };

  const addToWardrobe = async () => {
    if (!product) return;

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your wardrobe",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          name: product.name,
          image_url: product.image,
          category: product.category,
          brand: product.brand,
          price: product.price,
        });

      if (error) throw error;

      toast({
        title: "Added to Wardrobe!",
        description: "Item has been added to your wardrobe",
      });
    } catch (error: any) {
      console.error('Error adding to wardrobe:', error);
      
      // Check if item already exists
      if (error.code === '23505') {
        toast({
          title: "Already in Wardrobe",
          description: "This item is already in your wardrobe",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to wardrobe",
          variant: "destructive",
        });
      }
    }
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (isLoading || !product || !seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Button>
              <h1 className="text-2xl font-bold text-foreground">TRION</h1>
            </div>
            
            {/* Cart Icon with Badge */}
            <Link to="/">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index} className="text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Material</h3>
              <p className="text-muted-foreground">{product.material}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Color</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedColor === color 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : 'border-border bg-background'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Size</h3>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedSize === size 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : 'border-border bg-background'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={addToCart} className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="mt-12 bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
          <div className="flex items-center gap-4">
            <img 
              src={seller.avatar} 
              alt={seller.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <Link 
                to={`/seller/${seller.id}`}
                className="text-lg font-semibold text-primary hover:underline"
              >
                {seller.name}
              </Link>
              <p className="text-muted-foreground">{seller.storeName}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(seller.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {seller.rating.toFixed(1)} ({seller.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
          
          {/* Rating Summary */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">{reviews.length} reviews</p>
              </div>
              
              <div className="space-y-2">
                {getRatingDistribution().map((count, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm w-6">{5 - index}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Progress 
                      value={reviews.length > 0 ? (count / reviews.length) * 100 : 0} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {review.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.userName}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {similarProducts.map((similarProduct) => (
              <Link 
                key={similarProduct.id}
                to={`/product/${similarProduct.id}`}
                className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
              >
                <img 
                  src={similarProduct.image} 
                  alt={similarProduct.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate">{similarProduct.name}</h4>
                  <p className="text-primary font-semibold mt-1">₹{similarProduct.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;