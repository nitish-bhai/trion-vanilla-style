import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';

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
  const stats = [
    {
      title: 'Total Revenue',
      value: '₹2,45,890',
      change: '+12.5% from last month',
      icon: <TrendingUp className="text-green-500" size={24} />,
      color: 'text-green-500'
    },
    {
      title: 'Total Users',
      value: '1,234',
      change: '+5.2% from last month',
      icon: <Users className="text-primary" size={24} />,
      color: 'text-primary'
    },
    {
      title: 'Total Products',
      value: '456',
      change: '+8 new products',
      icon: <Package className="text-primary" size={24} />,
      color: 'text-primary'
    },
    {
      title: 'Total Orders',
      value: '789',
      change: '+15.8% from last month',
      icon: <ShoppingCart className="text-green-500" size={24} />,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default AdminStats;