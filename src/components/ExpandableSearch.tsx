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
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="flex items-center p-4">
                  <Search size={24} className="text-muted-foreground mr-3 flex-shrink-0" />
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
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
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
                <div className="px-4 pb-3 flex items-center justify-between border-t border-border pt-3">
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
                    className="px-4 pb-4 border-t border-border pt-3"
                  >
                    <p className="text-xs font-semibold text-foreground mb-2">Quick tips:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSearchValue('t-shirts')}
                        className="text-left px-3 py-2 bg-muted hover:bg-accent rounded-lg text-xs text-foreground transition-colors"
                      >
                        Try "t-shirts"
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAIMode(true);
                          setSearchValue('casual summer outfit');
                        }}
                        className="text-left px-3 py-2 bg-muted hover:bg-accent rounded-lg text-xs text-foreground transition-colors"
                      >
                        Try "casual summer outfit"
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpandableSearch;
