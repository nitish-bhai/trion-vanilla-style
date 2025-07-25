import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, Shirt } from 'lucide-react';
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  features: string[];
  colors: string[];
  material: string;
  sizes: string[];
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
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isTryOnLoading, setIsTryOnLoading] = useState(false);

  useEffect(() => {
    // Simulate API call
    const loadProductData = () => {
      const categories = ['Streetwear', 'Formal', 'Casual', 'Luxury', 'Sportswear'];
      const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'];
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const materials = ['Cotton', 'Polyester', 'Silk', 'Denim', 'Leather', 'Linen'];
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const baseNames = ['Jacket', 'Hoodie', 'Shirt', 'Dress', 'Pants', 'Sneakers', 'Boots'];
      const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
      
      const mockProduct: Product = {
        id: parseInt(id || '1'),
        name: `${category} ${baseName} #${id}`,
        price: Math.floor(Math.random() * (2999 - 499 + 1)) + 499,
        image: placeholderImage,
        category,
        description: `Premium ${category.toLowerCase()} ${baseName.toLowerCase()} crafted with attention to detail and modern design. This versatile piece combines comfort with style, making it perfect for any occasion. Features high-quality construction and contemporary aesthetic.`,
        features: [
          'Premium quality fabric',
          'Modern fit design',
          'Durable construction',
          'Easy care instructions',
          'Versatile styling options'
        ],
        colors: colors.slice(0, Math.floor(Math.random() * 4) + 2),
        material: materials[Math.floor(Math.random() * materials.length)],
        sizes: sizes
      };

      const mockSeller: Seller = {
        id: Math.floor(Math.random() * 100) + 1,
        name: `Seller ${Math.floor(Math.random() * 100) + 1}`,
        storeName: `${category} Store`,
        avatar: placeholderImage,
        rating: Math.floor(Math.random() * 20) / 4 + 4, // 4.0 to 5.0
        totalReviews: Math.floor(Math.random() * 1000) + 50,
        joinedDate: '2023'
      };

      const mockReviews: Review[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        userName: `Customer ${i + 1}`,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
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

      const mockSimilar: Product[] = Array.from({ length: 6 }, (_, i) => ({
        id: (parseInt(id || '1') + i + 1) * 10,
        name: `${category} ${baseName} #${i + 10}`,
        price: Math.floor(Math.random() * (2999 - 499 + 1)) + 499,
        image: placeholderImage,
        category,
        description: `Similar ${category.toLowerCase()} ${baseName.toLowerCase()} with premium quality.`,
        features: [],
        colors: [],
        material: materials[Math.floor(Math.random() * materials.length)],
        sizes: []
      }));

      setProduct(mockProduct);
      setSeller(mockSeller);
      setReviews(mockReviews);
      setSimilarProducts(mockSimilar);
      setSelectedColor(mockProduct.colors[0]);
      setSelectedSize(mockProduct.sizes[2]);
      setIsLoading(false);
    };

    setTimeout(loadProductData, 500);
  }, [id]);

  const addToCart = () => {
    toast({
      title: "Added to Cart",
      description: `${product?.name} added to your cart`,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserImage(file);
      setTryOnResult(null);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !product) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsTryOnLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('userImage', userImage);
      formData.append('clothImage', product.image);
      formData.append('category', 'upper_body');

      const response = await fetch('https://api.segmind.com/v1/try-on-diffusion', {
        method: 'POST',
        headers: {
          'x-api-key': 'SG_50fc9ec15c93bef3',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setTryOnResult(imageUrl);
      
      toast({
        title: "Try-On Complete!",
        description: "Your virtual try-on is ready",
      });
    } catch (error) {
      console.error('Try-on failed:', error);
      toast({
        title: "Try-On Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsTryOnLoading(false);
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
            <h1 className="text-2xl font-bold text-foreground">TRION</h1>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Shirt className="w-4 h-4 mr-2" />
                    Virtual Try-On
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Virtual Try-On - {product.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Upload Your Photo</h3>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                        {userImage && (
                          <div className="mt-4">
                            <img
                              src={URL.createObjectURL(userImage)}
                              alt="User upload"
                              className="w-full max-w-xs rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleTryOn} 
                        disabled={!userImage || isTryOnLoading}
                        className="w-full"
                      >
                        {isTryOnLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          'Try On This Item'
                        )}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Result</h3>
                      {tryOnResult ? (
                        <img
                          src={tryOnResult}
                          alt="Try-on result"
                          className="w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                          Your try-on result will appear here
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
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