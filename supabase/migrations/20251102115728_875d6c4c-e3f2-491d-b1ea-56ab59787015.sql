-- Create wardrobe_items table for storing user's clothing items
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Upper body', 'Lower body', 'Full body')),
  brand TEXT,
  price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own wardrobe items
CREATE POLICY "Users can view their own wardrobe items"
ON public.wardrobe_items
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own wardrobe items
CREATE POLICY "Users can insert their own wardrobe items"
ON public.wardrobe_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wardrobe items
CREATE POLICY "Users can update their own wardrobe items"
ON public.wardrobe_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own wardrobe items
CREATE POLICY "Users can delete their own wardrobe items"
ON public.wardrobe_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create tryon_results table for storing virtual try-on results
CREATE TABLE public.tryon_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  result_image_url TEXT NOT NULL,
  person_image_url TEXT NOT NULL,
  wardrobe_item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tryon_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own try-on results
CREATE POLICY "Users can view their own tryon results"
ON public.tryon_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own try-on results
CREATE POLICY "Users can insert their own tryon results"
ON public.tryon_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own try-on results
CREATE POLICY "Users can delete their own tryon results"
ON public.tryon_results
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_tryon_results_user_id ON public.tryon_results(user_id);