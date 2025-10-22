import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FilterOptions {
  maxPrice: number;
  categories: string[];
  sizes: string[];
  colors: string[];
  materials: string[];
  genders: string[];
  brands: string[];
  ratings: number[];
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (filters: FilterOptions) => void;
  availableFilters: {
    categories: string[];
    sizes: string[];
    colors: string[];
    materials: string[];
    genders: string[];
    brands: string[];
  };
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  onFilterChange,
  availableFilters
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'category'])
  );
  
  const [filters, setFilters] = useState<FilterOptions>({
    maxPrice: 10000,
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    genders: [],
    brands: [],
    ratings: []
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleCheckboxChange = (
    filterType: keyof FilterOptions,
    value: string | number
  ) => {
    setFilters(prev => {
      const currentArray = prev[filterType] as any[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      const newFilters = { ...prev, [filterType]: newArray };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const handlePriceChange = (value: number[]) => {
    const newFilters = { ...filters, maxPrice: value[0] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      maxPrice: 10000,
      categories: [],
      sizes: [],
      colors: [],
      materials: [],
      genders: [],
      brands: [],
      ratings: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const FilterSection: React.FC<{
    title: string;
    id: string;
    children: React.ReactNode;
  }> = ({ title, id, children }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border-b border-border pb-4 mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full mb-3 text-foreground hover:text-primary transition-colors"
        >
          <span className="font-semibold text-sm">{title}</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-card shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-4">
              {/* Clear All Button */}
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="w-full mb-4"
              >
                Clear All Filters
              </Button>

              {/* Price Range */}
              <FilterSection title="Price Range" id="price">
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={10000}
                    step={100}
                    value={[filters.maxPrice]}
                    onValueChange={handlePriceChange}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>₹0</span>
                    <span>₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </FilterSection>

              {/* Categories */}
              {availableFilters.categories.length > 0 && (
                <FilterSection title="Categories" id="category">
                  <div className="space-y-2">
                    {availableFilters.categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => handleCheckboxChange('categories', category)}
                        />
                        <Label
                          htmlFor={`cat-${category}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Gender */}
              {availableFilters.genders.length > 0 && (
                <FilterSection title="Gender" id="gender">
                  <div className="space-y-2">
                    {availableFilters.genders.map(gender => (
                      <div key={gender} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gender-${gender}`}
                          checked={filters.genders.includes(gender)}
                          onCheckedChange={() => handleCheckboxChange('genders', gender)}
                        />
                        <Label
                          htmlFor={`gender-${gender}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {gender}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Sizes */}
              {availableFilters.sizes.length > 0 && (
                <FilterSection title="Sizes" id="sizes">
                  <div className="grid grid-cols-4 gap-2">
                    {availableFilters.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => handleCheckboxChange('sizes', size)}
                        className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                          filters.sizes.includes(size)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground hover:bg-accent'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Colors */}
              {availableFilters.colors.length > 0 && (
                <FilterSection title="Colors" id="colors">
                  <div className="grid grid-cols-5 gap-2">
                    {availableFilters.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => handleCheckboxChange('colors', color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          filters.colors.includes(color)
                            ? 'border-primary scale-110'
                            : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Materials */}
              {availableFilters.materials.length > 0 && (
                <FilterSection title="Materials" id="materials">
                  <div className="space-y-2">
                    {availableFilters.materials.map(material => (
                      <div key={material} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mat-${material}`}
                          checked={filters.materials.includes(material)}
                          onCheckedChange={() => handleCheckboxChange('materials', material)}
                        />
                        <Label
                          htmlFor={`mat-${material}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {material}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Brands */}
              {availableFilters.brands.length > 0 && (
                <FilterSection title="Brands" id="brands">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableFilters.brands.map(brand => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={filters.brands.includes(brand)}
                          onCheckedChange={() => handleCheckboxChange('brands', brand)}
                        />
                        <Label
                          htmlFor={`brand-${brand}`}
                          className="text-sm cursor-pointer"
                        >
                          {brand}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Ratings */}
              <FilterSection title="Customer Ratings" id="ratings">
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={filters.ratings.includes(rating)}
                        onCheckedChange={() => handleCheckboxChange('ratings', rating)}
                      />
                      <Label
                        htmlFor={`rating-${rating}`}
                        className="text-sm cursor-pointer flex items-center gap-1"
                      >
                        {rating}★ & above
                      </Label>
                    </div>
                  ))}
                </div>
              </FilterSection>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterSidebar;
