import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess?: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMode: 'cod'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentModeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMode: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return false;
    }
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
      toast({ title: "Error", description: "Please enter a valid 10-digit phone number", variant: "destructive" });
      return false;
    }
    if (!formData.address.trim()) {
      toast({ title: "Error", description: "Please enter your address", variant: "destructive" });
      return false;
    }
    if (!formData.city.trim()) {
      toast({ title: "Error", description: "Please enter your city", variant: "destructive" });
      return false;
    }
    if (!formData.state.trim()) {
      toast({ title: "Error", description: "Please enter your state", variant: "destructive" });
      return false;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      toast({ title: "Error", description: "Please enter a valid 6-digit pincode", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (cart.length === 0) {
      toast({ title: "Error", description: "Your cart is empty", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please login to place an order",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Create order
      const shippingAddress = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          shipping_address: shippingAddress,
          status: 'pending',
          payment_status: formData.paymentMode === 'cod' ? 'pending' : 'paid'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.discount_percentage 
          ? item.price * (1 - item.discount_percentage / 100)
          : item.price,
        size: item.selectedSize || null,
        color: item.selectedColor || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order ID: ${orderData.id.slice(0, 8)}... We'll send you updates via email.`,
      });

      clearCart();
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Unable to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Details</CardTitle>
          <CardDescription>Enter your delivery information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="9876543210"
              maxLength={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="House No., Street, Locality"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Mumbai"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Maharashtra"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="400001"
                maxLength={6}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Select your preferred payment option</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={formData.paymentMode} onValueChange={handlePaymentModeChange}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">UPI Payment</p>
                  <p className="text-sm text-muted-foreground">Pay using UPI apps</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-muted-foreground">Pay using your card</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {cart.map(item => (
              <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{((item.discount_percentage ? item.price * (1 - item.discount_percentage / 100) : item.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{cartTotal.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Placing Order...
          </>
        ) : (
          `Place Order - ₹${cartTotal.toLocaleString()}`
        )}
      </Button>
    </form>
  );
};

export default CheckoutForm;
