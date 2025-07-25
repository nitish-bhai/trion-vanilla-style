import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ArrowLeft, MapPin, Calendar, Package } from 'lucide-react';
import placeholderImage from '@/assets/trion-placeholder.jpg';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface Seller {
  id: number;
  name: string;
  storeName: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  joinedDate: string;
  location: string;
  description: string;
  totalProducts: number;
  categories: string[];
}

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSellerData = () => {
      const categories = ['Streetwear', 'Formal', 'Casual', 'Luxury', 'Sportswear'];
      const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune'];
      
      const mockSeller: Seller = {
        id: parseInt(id || '1'),
        name: `Seller ${id}`,
        storeName: `${categories[Math.floor(Math.random() * categories.length)]} Store`,
        avatar: placeholderImage,
        rating: Math.floor(Math.random() * 20) / 4 + 4, // 4.0 to 5.0
        totalReviews: Math.floor(Math.random() * 1000) + 50,
        joinedDate: ['2021', '2022', '2023'][Math.floor(Math.random() * 3)],
        location: locations[Math.floor(Math.random() * locations.length)],
        description: `Welcome to our premium fashion store! We specialize in high-quality clothing and accessories. Our mission is to provide customers with the latest trends and timeless classics. We take pride in our excellent customer service and fast shipping.`,
        totalProducts: Math.floor(Math.random() * 200) + 50,
        categories: categories.slice(0, Math.floor(Math.random() * 3) + 2)
      };

      const baseNames = ['Jacket', 'Hoodie', 'Shirt', 'Dress', 'Pants', 'Sneakers', 'Boots', 'Accessories'];
      const mockProducts: Product[] = Array.from({ length: 24 }, (_, i) => {
        const category = mockSeller.categories[Math.floor(Math.random() * mockSeller.categories.length)];
        const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
        return {
          id: (parseInt(id || '1') * 1000) + i + 1,
          name: `${category} ${baseName} #${i + 1}`,
          price: Math.floor(Math.random() * (2999 - 499 + 1)) + 499,
          image: placeholderImage,
          category,
          description: `Premium ${category.toLowerCase()} ${baseName.toLowerCase()} crafted with attention to detail.`
        };
      });

      setSeller(mockSeller);
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setIsLoading(false);
    };

    setTimeout(loadSellerData, 500);
  }, [id]);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  if (isLoading || !seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading seller profile...</p>
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
        {/* Seller Profile Header */}
        <div className="bg-card rounded-lg p-8 border border-border mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img 
                src={seller.avatar} 
                alt={seller.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{seller.name}</h1>
                  <h2 className="text-xl text-primary font-semibold mb-3">{seller.storeName}</h2>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${
                              i < Math.floor(seller.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">{seller.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({seller.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {seller.joinedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{seller.totalProducts} products</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {seller.categories.map((category) => (
                      <Badge key={category} variant="secondary">{category}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button>Follow Store</Button>
                  <Button variant="outline">Contact Seller</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold mb-2">About Store</h3>
            <p className="text-muted-foreground">{seller.description}</p>
          </div>
        </div>

        {/* Store Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <div className="text-2xl font-bold text-primary mb-1">{seller.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <div className="text-2xl font-bold text-primary mb-1">{seller.rating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <div className="text-2xl font-bold text-primary mb-1">{seller.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <div className="text-2xl font-bold text-primary mb-1">98%</div>
            <div className="text-sm text-muted-foreground">Positive Feedback</div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-card rounded-lg border border-border">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Products ({filteredProducts.length})</TabsTrigger>
              <TabsTrigger value="reviews">Store Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="p-6">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    selectedCategory === 'All' 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  All ({products.length})
                </button>
                {seller.categories.map((category) => {
                  const count = products.filter(p => p.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        selectedCategory === category 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link 
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="bg-background rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-foreground truncate mb-1">{product.name}</h4>
                      <p className="text-primary font-bold text-lg">₹{product.price.toLocaleString()}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{product.category}</Badge>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="p-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Store reviews coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;