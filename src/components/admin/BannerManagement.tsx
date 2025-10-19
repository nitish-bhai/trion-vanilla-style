import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const BannerManagement: React.FC = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching banners",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('hero_banners')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Banner added successfully",
        description: `${formData.title} has been added.`,
      });
      
      resetForm();
      setShowAddModal(false);
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error adding banner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      const { error } = await supabase
        .from('hero_banners')
        .update(formData)
        .eq('id', editingBanner.id);

      if (error) throw error;

      toast({
        title: "Banner updated successfully",
        description: `${formData.title} has been updated.`,
      });
      
      resetForm();
      setEditingBanner(null);
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error updating banner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (bannerId: string, bannerTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bannerTitle}"?`)) return;

    try {
      const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;

      toast({
        title: "Banner deleted",
        description: `${bannerTitle} has been removed.`,
      });
      
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error deleting banner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ is_active: !currentStatus })
        .eq('id', bannerId);

      if (error) throw error;

      toast({
        title: "Banner status updated",
        description: `Banner is now ${!currentStatus ? 'active' : 'inactive'}.`,
      });
      
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error updating banner status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      is_active: true,
      display_order: 0
    });
  };

  const openEditModal = (banner: Banner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      cta_text: banner.cta_text || '',
      cta_link: banner.cta_link || '',
      is_active: banner.is_active,
      display_order: banner.display_order
    });
    setEditingBanner(banner);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Hero Banner Management</h2>
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} />
          Add Banner
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-muted flex items-center justify-center p-8">
                {banner.image_url ? (
                  <img src={banner.image_url} alt={banner.title} className="max-h-48 object-contain" />
                ) : (
                  <Image size={64} className="text-muted-foreground" />
                )}
              </div>
              <div className="md:w-2/3 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-foreground">{banner.title}</h3>
                    <p className="text-muted-foreground mt-1">{banner.subtitle}</p>
                    {banner.cta_text && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="font-medium">CTA:</span>
                        <span className="text-primary">{banner.cta_text}</span>
                        {banner.cta_link && (
                          <span className="text-muted-foreground">→ {banner.cta_link}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    {banner.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner.id, banner.title)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12">
          <Image size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No banners found. Add your first hero banner!</p>
        </div>
      )}

      {(showAddModal || editingBanner) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </h3>
            
            <form onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Banner Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="https://example.com/banner-image.jpg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    placeholder="Shop Now"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({...formData, cta_link: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    placeholder="/products"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-border"
                />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  {editingBanner ? 'Update Banner' : 'Add Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBanner(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
