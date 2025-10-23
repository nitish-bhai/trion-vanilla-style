import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';

interface ExpandableSearchProps {
  onSearch: (query: string) => void;
  onPromptSearch: (prompt: string) => void;
  placeholder?: string;
}

const ExpandableSearch: React.FC<ExpandableSearchProps> = ({
  onSearch,
  onPromptSearch,
  placeholder = "Search products..."
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      if (isAIMode) {
        onPromptSearch(searchValue);
      } else {
        onSearch(searchValue);
      }
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchValue('');
    setIsAIMode(false);
  };

  return (
    <>
      {/* Search Icon Button */}
      {!isExpanded && (
        <motion.button
          onClick={() => setIsExpanded(true)}
          className="p-3 hover:bg-muted rounded-full transition-colors relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Search size={24} className="text-foreground" />
        </motion.button>
      )}

      {/* Expanded Search Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4"
            >
              {/* Glassmorphism container with glow effect */}
              <div className="relative">
                {/* Outer glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                
                {/* Main search container */}
                <div className="relative bg-background/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
                  {/* Inner glow gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                  
                  {/* Search Input */}
                  <form onSubmit={handleSubmit} className="relative flex items-center p-4 z-10">
                    <Search size={24} className="text-primary mr-3 flex-shrink-0 drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder={
                        isAIMode
                          ? "Describe what you're looking for..."
                          : "Search by name, brand, category..."
                      }
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-lg font-medium"
                    />
                    
                    {/* AI Mode Toggle */}
                    <motion.button
                      type="button"
                      onClick={() => setIsAIMode(!isAIMode)}
                      className={`p-2 rounded-full mr-2 transition-colors ${
                        isAIMode
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={isAIMode ? "AI Search Active" : "Enable AI Search"}
                    >
                      <Sparkles size={20} />
                    </motion.button>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                    >
                      <X size={24} className="text-muted-foreground" />
                    </button>
                  </form>

                  {/* Search Mode Indicator */}
                  <div className="relative px-4 pb-3 flex items-center justify-between border-t border-border/50 pt-3 z-10 bg-background/30 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground">
                      {isAIMode ? (
                        <span className="flex items-center gap-1">
                          <Sparkles size={14} className="text-primary" />
                          AI-powered search active
                        </span>
                      ) : (
                        'Press Enter to search'
                      )}
                    </span>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd>
                      <span>to search</span>
                    </div>
                  </div>

                  {/* Quick Search Tips */}
                  {searchValue.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative px-4 pb-4 border-t border-border/50 pt-3 z-10 bg-background/30 backdrop-blur-sm"
                    >
                      <p className="text-xs font-semibold text-foreground mb-2">Quick tips:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSearchValue('t-shirts')}
                          className="text-left px-3 py-2 bg-muted/50 hover:bg-accent/50 backdrop-blur-sm rounded-lg text-xs text-foreground transition-all hover:scale-105"
                        >
                          Try "t-shirts"
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAIMode(true);
                            setSearchValue('casual summer outfit');
                          }}
                          className="text-left px-3 py-2 bg-muted/50 hover:bg-accent/50 backdrop-blur-sm rounded-lg text-xs text-foreground transition-all hover:scale-105"
                        >
                          Try "casual summer outfit"
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpandableSearch;
