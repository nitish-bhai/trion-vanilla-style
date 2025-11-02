import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trash2, Shirt, ShoppingCart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface WardrobeItem {
  id: string;
  name: string;
  image_url: string;
  category: string;
  brand?: string;
  price?: number;
  created_at: string;
}

interface TryOnResult {
  id: string;
  result_image_url: string;
  person_image_url: string;
  wardrobe_item_ids: any; // JSON type from database
  created_at: string;
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [tryOnResults, setTryOnResults] = useState<TryOnResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [isTryOnLoading, setIsTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
    fetchWardrobeItems(user.id);
    fetchTryOnResults(user.id);
  };

  const fetchWardrobeItems = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWardrobeItems(data || []);
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
      toast({
        title: "Error",
        description: "Failed to load wardrobe items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTryOnResults = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tryon_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Convert Json type to string array
      const results = (data || []).map(item => ({
        ...item,
        wardrobe_item_ids: Array.isArray(item.wardrobe_item_ids) ? item.wardrobe_item_ids : []
      }));
      setTryOnResults(results as TryOnResult[]);
    } catch (error) {
      console.error('Error fetching try-on results:', error);
    }
  };

  const deleteWardrobeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWardrobeItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      
      toast({
        title: "Item Removed",
        description: "Item removed from your wardrobe",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const deleteTryOnResult = async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('tryon_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      setTryOnResults(prev => prev.filter(result => result.id !== resultId));
      
      toast({
        title: "Result Deleted",
        description: "Try-on result deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting result:', error);
      toast({
        title: "Error",
        description: "Failed to delete result",
        variant: "destructive",
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserImage(file);
      setTryOnResult(null);
    }
  };

  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleTryOn = async () => {
    if (!userImage || selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please upload your photo and select at least one item",
        variant: "destructive",
      });
      return;
    }

    setIsTryOnLoading(true);
    
    try {
      const personImageBase64 = await imageToBase64(userImage);
      const selectedWardrobeItems = wardrobeItems.filter(item => selectedItems.includes(item.id));

      // Categorize selected items
      const upperItems = selectedWardrobeItems.filter(item => item.category === 'Upper body');
      const lowerItems = selectedWardrobeItems.filter(item => item.category === 'Lower body');
      
      let resultImage: string;

      if (upperItems.length > 0 && lowerItems.length > 0) {
        // Full body try-on with separate upper and lower
        const upperImage = await fetch(upperItems[0].image_url).then(r => r.blob());
        const lowerImage = await fetch(lowerItems[0].image_url).then(r => r.blob());
        
        const upperBase64 = await imageToBase64(upperImage as File);
        const lowerBase64 = await imageToBase64(lowerImage as File);

        const { data, error } = await supabase.functions.invoke('virtual-tryon', {
          body: {
            personImageBase64,
            upperGarmentBase64: upperBase64,
            lowerGarmentBase64: lowerBase64,
            category: 'Full body',
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success || !data?.image) throw new Error('Invalid response');
        
        resultImage = data.image.startsWith('data:') ? data.image : `data:image/jpeg;base64,${data.image}`;
      } else if (selectedWardrobeItems.length > 0) {
        // Single item try-on
        const item = selectedWardrobeItems[0];
        
        const { data, error } = await supabase.functions.invoke('virtual-tryon', {
          body: {
            personImageBase64,
            garmentImageUrl: item.image_url,
            category: item.category,
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success || !data?.image) throw new Error('Invalid response');
        
        resultImage = data.image.startsWith('data:') ? data.image : `data:image/jpeg;base64,${data.image}`;
      } else {
        throw new Error('No valid items selected');
      }

      setTryOnResult(resultImage);

      // Save the result to database
      if (user) {
        const personImageBase64WithPrefix = `data:image/jpeg;base64,${personImageBase64}`;
        
        const { error: insertError } = await supabase
          .from('tryon_results')
          .insert({
            user_id: user.id,
            result_image_url: resultImage,
            person_image_url: personImageBase64WithPrefix,
            wardrobe_item_ids: selectedItems,
          });

        if (insertError) {
          console.error('Error saving result:', insertError);
        } else {
          fetchTryOnResults(user.id);
        }
      }

      toast({
        title: "Try-On Complete!",
        description: "Your virtual try-on is ready and saved",
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

  const getSelectedItemsByCategory = () => {
    const selected = wardrobeItems.filter(item => selectedItems.includes(item.id));
    return {
      upper: selected.filter(item => item.category === 'Upper body'),
      lower: selected.filter(item => item.category === 'Lower body'),
    };
  };

  const { upper, lower } = getSelectedItemsByCategory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wardrobe...</p>
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
              <h1 className="text-2xl font-bold text-foreground">My Wardrobe</h1>
            </div>
            
            <Link to="/">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="wardrobe" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="wardrobe">My Clothes</TabsTrigger>
            <TabsTrigger value="results">Try-On Results</TabsTrigger>
          </TabsList>

          {/* Wardrobe Items Tab */}
          <TabsContent value="wardrobe" className="space-y-6">
            {/* Try-On Section */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Virtual Try-On</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Upload Photo */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Upload Your Photo</h3>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    {userImage && (
                      <div className="bg-muted rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(userImage)}
                          alt="User upload"
                          className="w-full max-h-[300px] object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Selected Items */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Selected Items ({selectedItems.length})</h3>
                    {upper.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Upper Body:</p>
                        {upper.map(item => (
                          <div key={item.id} className="flex items-center gap-2 mb-2">
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            <span className="text-sm">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {lower.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Lower Body:</p>
                        {lower.map(item => (
                          <div key={item.id} className="flex items-center gap-2 mb-2">
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            <span className="text-sm">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button 
                      onClick={handleTryOn} 
                      disabled={!userImage || selectedItems.length === 0 || isTryOnLoading}
                      className="w-full"
                    >
                      {isTryOnLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shirt className="w-4 h-4 mr-2" />
                          Try On Selected
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Result */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Result</h3>
                    {tryOnResult ? (
                      <div className="bg-muted rounded-lg overflow-hidden">
                        <img
                          src={tryOnResult}
                          alt="Try-on result"
                          className="w-full max-h-[300px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Result will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wardrobe Items Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Wardrobe ({wardrobeItems.length} items)</h2>
              {wardrobeItems.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Shirt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">Your wardrobe is empty</p>
                    <Button onClick={() => navigate('/')}>
                      Browse Products
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wardrobeItems.map(item => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative">
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="bg-background"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => deleteWardrobeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Try-On Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <h2 className="text-xl font-semibold">Saved Try-On Results ({tryOnResults.length})</h2>
            {tryOnResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Shirt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No saved results yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tryOnResults.map(result => (
                  <Card key={result.id} className="overflow-hidden">
                    <div className="relative">
                      <img 
                        src={result.result_image_url} 
                        alt="Try-on result"
                        className="w-full aspect-square object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => deleteTryOnResult(result.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wardrobe;
