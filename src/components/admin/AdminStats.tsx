import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, color }) => (
  <motion.div
    className="bg-card rounded-lg p-6 border border-border shadow-sm"
    whileHover={{ scale: 1.02 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        <p className={`text-sm mt-1 ${color}`}>{change}</p>
      </div>
      <div className={`p-3 rounded-full ${color === 'text-green-500' ? 'bg-green-100' : 'bg-primary/10'}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up real-time subscriptions
    const productsChannel = supabase
      .channel('stats-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchStats)
      .subscribe();

    const ordersChannel = supabase
      .channel('stats-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe();

    const usersChannel = supabase
      .channel('stats-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch orders count and total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const ordersCount = orders?.length || 0;

      setStats({
        totalRevenue,
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Total Revenue',
      value: loading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`,
      change: 'Real-time data',
      icon: <TrendingUp className="text-green-500" size={24} />,
      color: 'text-green-500'
    },
    {
      title: 'Total Users',
      value: loading ? '...' : stats.totalUsers.toString(),
      change: 'Active users',
      icon: <Users className="text-primary" size={24} />,
      color: 'text-primary'
    },
    {
      title: 'Total Products',
      value: loading ? '...' : stats.totalProducts.toString(),
      change: 'In inventory',
      icon: <Package className="text-primary" size={24} />,
      color: 'text-primary'
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : stats.totalOrders.toString(),
      change: 'All time',
      icon: <ShoppingCart className="text-green-500" size={24} />,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default AdminStats;