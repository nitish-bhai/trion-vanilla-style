import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Smartphone, Zap, Shield, Star, Truck } from 'lucide-react';
import techFeatures from '@/assets/tech-features.png';

const BrandFeatures: React.FC = () => {
  const features = [
    {
      icon: Eye,
      title: 'Virtual Try-On Technology',
      description: 'Experience clothes before you buy with our advanced AR technology. See how items fit and look on you virtually.',
      highlight: 'AR Powered'
    },
    {
      icon: Smartphone,
      title: 'Smart Fashion AI',
      description: 'Our AI learns your style preferences and suggests personalized recommendations that match your taste.',
      highlight: 'AI Driven'
    },
    {
      icon: Zap,
      title: 'Instant Style Matching',
      description: 'Get instant outfit suggestions and color combinations with our intelligent style matching algorithm.',
      highlight: 'Real-time'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Premium materials and construction with a 30-day quality guarantee on all products.',
      highlight: '30-Day Guarantee'
    },
    {
      icon: Star,
      title: 'Curated Collections',
      description: 'Hand-picked items from top designers and emerging brands, ensuring you get the latest trends.',
      highlight: 'Expert Curated'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Express delivery within 24 hours in major cities. Track your order in real-time.',
      highlight: '24hr Delivery'
    }
  ];

  return (
    <motion.section 
      className="bg-gradient-to-br from-background to-muted/20 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why Choose <span className="text-primary">TRION</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're revolutionizing fashion retail with cutting-edge technology and personalized experiences. 
            Discover the future of shopping with TRION.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Tech Image */}
          <motion.div
            className="relative"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 overflow-hidden">
              <img 
                src={techFeatures} 
                alt="TRION Technology Features" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Floating elements */}
              <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-sm rounded-full p-3">
                <Zap className="text-primary" size={24} />
              </div>
              <div className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-sm rounded-full p-3">
                <Eye className="text-primary" size={24} />
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="space-y-6"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-3 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                      <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Brand Stats */}
        <motion.div
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {[
            { number: '10K+', label: 'Happy Customers' },
            { number: '500+', label: 'Premium Brands' },
            { number: '50K+', label: 'Products Available' },
            { number: '24/7', label: 'Customer Support' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
            >
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default BrandFeatures;