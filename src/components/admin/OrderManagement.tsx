import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Eye, Edit2, Truck, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  payment_status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  products?: {
    name: string;
    brand: string;
  };
}

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, brand)
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch user profiles separately
      if (data) {
        const userIds = [...new Set(data.map(order => order.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        // Map profiles to orders
        const ordersWithProfiles = data.map(order => ({
          ...order,
          profiles: profiles?.find(p => p.user_id === order.user_id)
        }));
        
        setOrders(ordersWithProfiles as Order[]);
      }

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
      
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Payment status updated",
        description: `Payment status changed to ${newStatus}`,
      });
      
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error updating payment status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Total Orders: {filteredOrders.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Total</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Payment</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {order.id.slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{order.profiles?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">₹{order.total_amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(order.status)}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.payment_status}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      {paymentStatusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Eye size={16} />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <p className="text-sm text-muted-foreground">ID: {selectedOrder.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: ₹{selectedOrder.total_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p className="text-sm">{selectedOrder.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.profiles?.email}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedOrder.shipping_address, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.products?.brand} • Qty: {item.quantity}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                      </div>
                      <span className="font-medium">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;