
-- Create authentication schema (if not already exists - this is handled by Supabase)

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create barriers table
CREATE TABLE public.barriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.barriers ENABLE ROW LEVEL SECURITY;

-- Create learning_styles table
CREATE TABLE public.learning_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.learning_styles ENABLE ROW LEVEL SECURITY;

-- Create activities table
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  development JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create activity_barriers junction table
CREATE TABLE public.activity_barriers (
  activity_id UUID REFERENCES public.activities ON DELETE CASCADE,
  barrier_id UUID REFERENCES public.barriers ON DELETE CASCADE,
  PRIMARY KEY (activity_id, barrier_id)
);

-- Enable Row Level Security
ALTER TABLE public.activity_barriers ENABLE ROW LEVEL SECURITY;

-- Create activity_learning_styles junction table
CREATE TABLE public.activity_learning_styles (
  activity_id UUID REFERENCES public.activities ON DELETE CASCADE,
  learning_style_id UUID REFERENCES public.learning_styles ON DELETE CASCADE,
  PRIMARY KEY (activity_id, learning_style_id)
);

-- Enable Row Level Security
ALTER TABLE public.activity_learning_styles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create interventions table
CREATE TABLE public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users NOT NULL,
  student_id UUID REFERENCES public.students NOT NULL,
  activity_id UUID REFERENCES public.activities NOT NULL,
  subject TEXT,
  observations TEXT,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Create intervention_barriers junction table
CREATE TABLE public.intervention_barriers (
  intervention_id UUID REFERENCES public.interventions ON DELETE CASCADE,
  barrier_id UUID REFERENCES public.barriers ON DELETE CASCADE,
  PRIMARY KEY (intervention_id, barrier_id)
);

-- Enable Row Level Security
ALTER TABLE public.intervention_barriers ENABLE ROW LEVEL SECURITY;

-- Create intervention_learning_styles junction table
CREATE TABLE public.intervention_learning_styles (
  intervention_id UUID REFERENCES public.interventions ON DELETE CASCADE,
  learning_style_id UUID REFERENCES public.learning_styles ON DELETE CASCADE,
  PRIMARY KEY (intervention_id, learning_style_id)
);

-- Enable Row Level Security
ALTER TABLE public.intervention_learning_styles ENABLE ROW LEVEL SECURITY;

-- Create intervention comments table
CREATE TABLE public.intervention_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id UUID REFERENCES public.interventions ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.intervention_comments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Barriers RLS Policies
CREATE POLICY "Anyone can view barriers" 
  ON public.barriers 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert barriers" 
  ON public.barriers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update barriers they created" 
  ON public.barriers 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete barriers they created" 
  ON public.barriers 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Learning Styles RLS Policies
CREATE POLICY "Anyone can view learning styles" 
  ON public.learning_styles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert learning styles" 
  ON public.learning_styles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update learning styles they created" 
  ON public.learning_styles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete learning styles they created" 
  ON public.learning_styles 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Activities RLS Policies
CREATE POLICY "Anyone can view activities" 
  ON public.activities 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert activities" 
  ON public.activities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update activities they created" 
  ON public.activities 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete activities they created" 
  ON public.activities 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Activity Barriers RLS Policies
CREATE POLICY "Anyone can view activity barriers" 
  ON public.activity_barriers 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage activity barriers for their activities" 
  ON public.activity_barriers 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.activities 
    WHERE id = activity_barriers.activity_id 
    AND created_by = auth.uid()
  ));

-- Activity Learning Styles RLS Policies
CREATE POLICY "Anyone can view activity learning styles" 
  ON public.activity_learning_styles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage activity learning styles for their activities" 
  ON public.activity_learning_styles 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.activities 
    WHERE id = activity_learning_styles.activity_id 
    AND created_by = auth.uid()
  ));

-- Students RLS Policies
CREATE POLICY "Anyone can view students" 
  ON public.students 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert students" 
  ON public.students 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update students they created" 
  ON public.students 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete students they created" 
  ON public.students 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Interventions RLS Policies
CREATE POLICY "Anyone can view interventions" 
  ON public.interventions 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert interventions" 
  ON public.interventions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Users can update interventions they created" 
  ON public.interventions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = teacher_id);

CREATE POLICY "Users can delete interventions they created" 
  ON public.interventions 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = teacher_id);

-- Intervention Barriers RLS Policies
CREATE POLICY "Anyone can view intervention barriers" 
  ON public.intervention_barriers 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage intervention barriers for their interventions" 
  ON public.intervention_barriers 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.interventions 
    WHERE id = intervention_barriers.intervention_id 
    AND teacher_id = auth.uid()
  ));

-- Intervention Learning Styles RLS Policies
CREATE POLICY "Anyone can view intervention learning styles" 
  ON public.intervention_learning_styles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can manage intervention learning styles for their interventions" 
  ON public.intervention_learning_styles 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.interventions 
    WHERE id = intervention_learning_styles.intervention_id 
    AND teacher_id = auth.uid()
  ));

-- Intervention Comments RLS Policies
CREATE POLICY "Anyone can view intervention comments" 
  ON public.intervention_comments 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert intervention comments" 
  ON public.intervention_comments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
  ON public.intervention_comments 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
  ON public.intervention_comments 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = author_id);

-- Create trigger to update profiles on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at timestamp
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_barriers_timestamp
  BEFORE UPDATE ON public.barriers
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_learning_styles_timestamp
  BEFORE UPDATE ON public.learning_styles
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_activities_timestamp
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_students_timestamp
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_interventions_timestamp
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();
