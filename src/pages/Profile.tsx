import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Package, Settings, CreditCard, MapPin, FileText, Gift, Smartphone, ChevronRight, ArrowLeft, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

type MenuItem = 'profile' | 'addresses' | 'pan' | 'orders' | 'wardrobe' | 'gift-cards' | 'saved-upi' | 'saved-cards';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<MenuItem>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    mobile: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/auth');
        return;
      }
      
      setUser(user);
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setProfile(data);
        const [firstName, ...lastNameParts] = (data.full_name || '').split(' ');
        setFormData({
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          gender: 'male',
          email: data.email || user?.email || '',
          mobile: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      
      setIsEditing(false);
      await fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Personal Information</h2>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="text-primary hover:text-primary/80"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(user.id);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Your Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={!isEditing}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">Email Address</h3>
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  disabled
                >
                  Edit
                </Button>
              </div>
              <Input
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">Mobile Number</h3>
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  disabled
                >
                  Edit
                </Button>
              </div>
              <Input
                value={formData.mobile || '+916306170787'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">My Orders</h2>
            <Card className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders yet</p>
              <Button
                onClick={() => navigate('/')}
                className="mt-4"
              >
                Start Shopping
              </Button>
            </Card>
          </div>
        );

      case 'addresses':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Manage Addresses</h2>
            <Card className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No addresses saved</p>
              <Button className="mt-4">Add New Address</Button>
            </Card>
          </div>
        );

      case 'pan':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">PAN Card Information</h2>
            <Card className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No PAN card information added</p>
              <Button className="mt-4">Add PAN Details</Button>
            </Card>
          </div>
        );

      case 'wardrobe':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">My Wardrobe</h2>
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">View and manage your wardrobe items</p>
              <Button onClick={() => navigate('/wardrobe')}>
                Go to Wardrobe
              </Button>
            </Card>
          </div>
        );

      case 'gift-cards':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Gift Cards</h2>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Available Balance</p>
                  <p className="text-2xl font-bold text-primary">₹0</p>
                </div>
              </div>
            </div>
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No gift cards available</p>
            </Card>
          </div>
        );

      case 'saved-upi':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Saved UPI</h2>
            <Card className="p-8 text-center">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No UPI IDs saved</p>
              <Button className="mt-4">Add UPI ID</Button>
            </Card>
          </div>
        );

      case 'saved-cards':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Saved Cards</h2>
            <Card className="p-8 text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No cards saved</p>
              <Button className="mt-4">Add Card</Button>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">TRION</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.aside 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-4">
              {/* User Info Card */}
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hello,</p>
                    <p className="font-semibold text-foreground">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* My Orders */}
              <Card className="overflow-hidden">
                <button
                  onClick={() => setSelectedSection('orders')}
                  className={`w-full flex items-center justify-between p-4 hover:bg-accent transition-colors ${
                    selectedSection === 'orders' ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">MY ORDERS</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </Card>

              {/* Account Settings */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">ACCOUNT SETTINGS</span>
                  </div>
                </div>
                <div className="divide-y">
                  <button
                    onClick={() => setSelectedSection('profile')}
                    className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'profile' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => setSelectedSection('addresses')}
                    className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'addresses' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    Manage Addresses
                  </button>
                  <button
                    onClick={() => setSelectedSection('pan')}
                    className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'pan' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    PAN Card Information
                  </button>
                </div>
              </Card>

              {/* Payments */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">PAYMENTS</span>
                  </div>
                </div>
                <div className="divide-y">
                  <button
                    onClick={() => setSelectedSection('gift-cards')}
                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'gift-cards' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    <span>Gift Cards</span>
                    <span className="text-sm text-primary font-semibold">₹0</span>
                  </button>
                  <button
                    onClick={() => setSelectedSection('saved-upi')}
                    className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'saved-upi' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    Saved UPI
                  </button>
                  <button
                    onClick={() => setSelectedSection('saved-cards')}
                    className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                      selectedSection === 'saved-cards' ? 'bg-accent text-primary' : 'text-foreground'
                    }`}
                  >
                    Saved Cards
                  </button>
                </div>
              </Card>

              {/* My Wardrobe */}
              <Card className="overflow-hidden">
                <button
                  onClick={() => navigate('/wardrobe')}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">MY WARDROBE</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </Card>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main 
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              {renderContent()}
            </Card>
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
