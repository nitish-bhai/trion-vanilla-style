import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface ProductModel extends THREE.Group {
  rotation: THREE.Euler;
  position: THREE.Vector3;
}

function ProductMesh({ position, color, product }: { position: [number, number, number], color: string, product: string }) {
  const meshRef = React.useRef<ProductModel>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.01;
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const geometry = React.useMemo(() => {
    switch (product) {
      case 'shoe':
        return new THREE.BoxGeometry(1.5, 0.5, 2.5);
      case 'tshirt':
        return new THREE.BoxGeometry(2, 2.5, 0.2);
      case 'glasses':
        return new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
      case 'hoodie':
        return new THREE.BoxGeometry(2.2, 2.8, 0.3);
      case 'pants':
        return new THREE.CylinderGeometry(0.8, 0.6, 3, 8);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [product]);

  return (
    <group ref={meshRef} position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Scene() {
  const products = [
    { product: 'shoe', color: '#8B4513', position: [-4, 0, 0] as [number, number, number] },
    { product: 'tshirt', color: '#FF6B6B', position: [-2, 0, 0] as [number, number, number] },
    { product: 'glasses', color: '#4ECDC4', position: [0, 0, 0] as [number, number, number] },
    { product: 'hoodie', color: '#45B7D1', position: [2, 0, 0] as [number, number, number] },
    { product: 'pants', color: '#96CEB4', position: [4, 0, 0] as [number, number, number] },
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={75} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {products.map((item, index) => (
        <ProductMesh key={index} {...item} />
      ))}
    </>
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

          {/* Right 3D Carousel */}
          <motion.div 
            className="h-96 lg:h-[500px] rounded-lg overflow-hidden"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Suspense fallback={
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="trion-spinner"></div>
              </div>
            }>
              <Canvas>
                <Scene />
              </Canvas>
            </Suspense>
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