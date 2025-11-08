import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Save, Upload, Globe, Shield, Bell, Palette, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({
    site_name: '',
    site_description: '',
    contact_email: '',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    currency: 'USD',
    tax_rate: '0',
    shipping_fee: '0',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    enable_email_notifications: true,
    enable_sms_notifications: false,
    fitroom_api_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default settings structure
  const defaultSettings = {
    site_name: 'Trion Fashion Store',
    site_description: 'Your premier fashion destination',
    contact_email: 'contact@trion.com',
    contact_phone: '+1 234 567 8900',
    currency: 'INR',
    currency_symbol: '₹',
    tax_rate: 18,
    shipping_cost: 50,
    free_shipping_threshold: 1000,
    featured_categories: ['T-Shirts', 'Hoodies', 'Sneakers'],
    social_links: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    email_notifications: true,
    order_notifications: true,
    marketing_emails: false,
    maintenance_mode: false,
    fitroom_api_key: '',
    tryon_provider: 'fitroom'
  };

  const [formData, setFormData] = useState(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      // Convert array of settings to object
      const settingsObj = { ...defaultSettings };
      data?.forEach(setting => {
        if (setting.setting_key in settingsObj) {
          (settingsObj as any)[setting.setting_key] = setting.setting_value;
        }
      });

      setSettings(data || []);
      setFormData(settingsObj);
    } catch (error: any) {
      toast({
        title: "Error fetching settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, description: string = '') => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save each setting
      await Promise.all([
        updateSetting('site_name', formData.site_name, 'Website name'),
        updateSetting('site_description', formData.site_description, 'Website description'),
        updateSetting('contact_email', formData.contact_email, 'Contact email address'),
        updateSetting('contact_phone', formData.contact_phone, 'Contact phone number'),
        updateSetting('currency', formData.currency, 'Default currency'),
        updateSetting('currency_symbol', formData.currency_symbol, 'Currency symbol'),
        updateSetting('tax_rate', formData.tax_rate, 'Tax rate percentage'),
        updateSetting('shipping_cost', formData.shipping_cost, 'Default shipping cost'),
        updateSetting('free_shipping_threshold', formData.free_shipping_threshold, 'Free shipping threshold'),
        updateSetting('featured_categories', formData.featured_categories, 'Featured product categories'),
        updateSetting('social_links', formData.social_links, 'Social media links'),
        updateSetting('email_notifications', formData.email_notifications, 'Enable email notifications'),
        updateSetting('order_notifications', formData.order_notifications, 'Enable order notifications'),
        updateSetting('marketing_emails', formData.marketing_emails, 'Enable marketing emails'),
        updateSetting('maintenance_mode', formData.maintenance_mode, 'Maintenance mode status'),
        updateSetting('fitroom_api_key', formData.fitroom_api_key, 'FITROOM Virtual Try-On API Key'),
        updateSetting('tryon_provider', formData.tryon_provider, 'Virtual Try-On Provider Selection')
      ]);

      toast({
        title: "Settings saved",
        description: "All settings have been updated successfully.",
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  const handleUpdateFitroomApiKey = async () => {
    if (!formData.fitroom_api_key || formData.fitroom_api_key.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateSetting('fitroom_api_key', formData.fitroom_api_key, 'FITROOM Virtual Try-On API Key');
      toast({
        title: "Success",
        description: "FITROOM API key updated successfully. The virtual try-on feature will now use the new key.",
      });
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update API key: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold text-foreground">Site Settings</h2>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">General Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={formData.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                value={formData.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commerce Settings */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Commerce Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Shipping Cost</label>
                <input
                  type="number"
                  value={formData.shipping_cost}
                  onChange={(e) => handleInputChange('shipping_cost', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Free Shipping Threshold</label>
                <input
                  type="number"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => handleInputChange('free_shipping_threshold', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Settings */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Social Media Links</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(formData.social_links).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium mb-2 capitalize">{platform}</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive general email notifications</p>
              </div>
              <input
                type="checkbox"
                checked={formData.email_notifications}
                onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                className="rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about new orders</p>
              </div>
              <input
                type="checkbox"
                checked={formData.order_notifications}
                onChange={(e) => handleInputChange('order_notifications', e.target.checked)}
                className="rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Send marketing emails to customers</p>
              </div>
              <input
                type="checkbox"
                checked={formData.marketing_emails}
                onChange={(e) => handleInputChange('marketing_emails', e.target.checked)}
                className="rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Put site in maintenance mode</p>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenance_mode}
                onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                className="rounded border-border"
              />
            </div>
          </div>
        </div>

        {/* Virtual Try-On Settings */}
        <div className="bg-card rounded-lg p-6 border border-border space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Virtual Try-On Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Try-On Provider</label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose your virtual try-on provider
              </p>
              <select
                value={formData.tryon_provider}
                onChange={(e) => handleInputChange('tryon_provider', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="fitroom">Fitroom API</option>
                <option value="nano_banana">Nano Banana (Lovable AI)</option>
              </select>
            </div>

            {formData.tryon_provider === 'fitroom' && (
              <div>
                <label className="block font-medium mb-2">FITROOM API Key</label>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your FITROOM API key when your trial credits expire or when you need to switch to a new key.
                </p>
                <input
                  type="password"
                  value={formData.fitroom_api_key || ''}
                  onChange={(e) => handleInputChange('fitroom_api_key', e.target.value)}
                  placeholder="Enter your FITROOM API key"
                  className="w-full px-4 py-2 mb-4 rounded-md border border-input bg-background"
                />
                <Button
                  onClick={handleUpdateFitroomApiKey}
                  disabled={saving}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {saving ? 'Updating...' : 'Update FITROOM API Key'}
                </Button>
              </div>
            )}

            {formData.tryon_provider === 'nano_banana' && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Nano Banana (Lovable AI)</p>
                <p className="text-xs text-muted-foreground">
                  Nano Banana uses Lovable AI Gateway with automatic authentication. No API key configuration needed.
                  This provider uses AI-powered image generation for virtual try-on.
                </p>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Changes to the provider or API key take effect immediately across all virtual try-on features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;