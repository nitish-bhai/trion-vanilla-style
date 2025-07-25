import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import heroHoodie from '@/assets/hero-hoodie.jpg';
import heroSneaker from '@/assets/hero-sneaker.jpg';
import heroWatch from '@/assets/hero-watch.jpg';
import heroGlasses from '@/assets/hero-glasses.jpg';

const productShowcase = [
  {
    image: heroHoodie,
    title: 'Smart Hoodies',
    feature: 'Temperature Control Technology',
    promotion: '40% OFF',
    description: 'Built-in heating elements & moisture-wicking fabric'
  },
  {
    image: heroSneaker,
    title: 'Performance Sneakers',
    feature: 'Advanced Sole Technology',
    promotion: 'Buy 1 Get 1 Free',
    description: 'Energy-return foam & breathable mesh design'
  },
  {
    image: heroWatch,
    title: 'Designer Watches',
    feature: 'Smart Features',
    promotion: '25% OFF',
    description: 'Heart rate monitoring & GPS tracking'
  },
  {
    image: heroGlasses,
    title: 'UV Protection Glasses',
    feature: 'Blue Light Blocking',
    promotion: 'Free Shipping',
    description: '100% UV protection & anti-glare coating'
  }
];

function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 30 
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    
    // Auto-scroll every 4 seconds
    const autoScroll = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);

    return () => {
      clearInterval(autoScroll);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {productShowcase.map((product, index) => (
          <div key={index} className="flex-[0_0_100%] min-w-0">
            <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden group">
              <motion.img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Product Info */}
              <motion.div 
                className="absolute bottom-6 left-6 right-6 text-white"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="inline-block bg-primary px-3 py-1 rounded-full text-sm font-semibold mb-2">
                  {product.promotion}
                </div>
                <h3 className="text-2xl font-bold mb-1">{product.title}</h3>
                <p className="text-primary-foreground/90 font-medium mb-1">{product.feature}</p>
                <p className="text-sm text-primary-foreground/80">{product.description}</p>
              </motion.div>

              {/* Feature Badge */}
              <motion.div 
                className="absolute top-6 right-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <span className="text-white text-sm font-medium">NEW</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const HeroSection: React.FC = () => {
  return (
    <motion.section 
      className="relative bg-gradient-to-br from-primary/5 to-primary/10 py-16 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6">
              TRION
              <span className="block text-primary text-3xl lg:text-4xl font-normal">
                Fashion Forward
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
              Discover the future of fashion with our intelligent shopping experience. 
              Try on clothes virtually before you buy.
            </p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <button className="trion-btn text-lg px-8 py-3">
                Start Shopping
              </button>
              <button className="trion-btn-secondary trion-btn text-lg px-8 py-3">
                Virtual Try-On
              </button>
            </motion.div>
          </motion.div>

          {/* Right Product Carousel */}
          <motion.div 
            className="h-96 lg:h-[500px]"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <ProductCarousel />
          </motion.div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/8 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
    </motion.section>
  );
};

export default HeroSection;