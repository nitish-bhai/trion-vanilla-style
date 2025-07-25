import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, ShoppingCart, Package, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: any[];
  topProducts: any[];
  ordersByStatus: any[];
  revenueByMonth: any[];
}

const Analytics: React.FC = () => {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    recentOrders: [],
    topProducts: [],
    ordersByStatus: [],
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - parseInt(dateRange));

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Fetch products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch users data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalUsers = profiles?.length || 0;
      const totalProducts = products?.length || 0;

      // Orders by status
      const ordersByStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => ({
        status,
        count: orders?.filter(order => order.status === status).length || 0
      }));

      // Recent orders (last 10)
      const recentOrders = orders?.slice(0, 10) || [];

      // Revenue by month (simplified)
      const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        }) || [];
        
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
        };
      }).reverse();

      setAnalyticsData({
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts,
        recentOrders,
        topProducts: products?.slice(0, 5) || [],
        ordersByStatus,
        revenueByMonth
      });

    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, change }: any) => (
    <motion.div
      className="bg-card rounded-lg p-6 border border-border shadow-sm"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && <p className={`text-sm mt-1 ${color}`}>{change}</p>}
        </div>
        <div className={`p-3 rounded-full ${color === 'text-green-500' ? 'bg-green-100' : 'bg-primary/10'}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${analyticsData.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp className="text-green-500" size={24} />}
          color="text-green-500"
          change="+12.5% from last period"
        />
        <StatCard
          title="Total Orders"
          value={analyticsData.totalOrders}
          icon={<ShoppingCart className="text-primary" size={24} />}
          color="text-primary"
          change="+8.2% from last period"
        />
        <StatCard
          title="Total Users"
          value={analyticsData.totalUsers}
          icon={<Users className="text-primary" size={24} />}
          color="text-primary"
          change="+5.1% from last period"
        />
        <StatCard
          title="Total Products"
          value={analyticsData.totalProducts}
          icon={<Package className="text-primary" size={24} />}
          color="text-primary"
          change="+3 new products"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {analyticsData.ordersByStatus.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{item.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${analyticsData.totalOrders > 0 ? (item.count / analyticsData.totalOrders) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
          <div className="space-y-3">
            {analyticsData.revenueByMonth.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.max(...analyticsData.revenueByMonth.map(r => r.revenue)) > 0 ? 
                          (item.revenue / Math.max(...analyticsData.revenueByMonth.map(r => r.revenue))) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-20">₹{item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {analyticsData.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">₹{order.total_amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">₹{product.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;