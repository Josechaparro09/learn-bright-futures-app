# API Documentation - Educational Platform

## Overview

This is a React/TypeScript educational platform that helps teachers create inclusive learning activities, manage student interventions, and generate AI-powered educational content. The platform integrates with Supabase for data management and OpenAI for AI-powered activity generation.

## Table of Contents

1. [Core Components](#core-components)
2. [Authentication](#authentication)
3. [Data Layer](#data-layer)
4. [AI Integration](#ai-integration)
5. [UI Components](#ui-components)
6. [Hooks](#hooks)
7. [Utilities](#utilities)
8. [Types](#types)

---

## Core Components

### ActivityAIGenerator

**File:** `src/components/ActivityAIGenerator.tsx`

AI-powered activity generation component that creates educational activities based on learning barriers and styles.

#### Props

```typescript
interface ActivityAIGeneratorProps {
  selectedBarriers: Tables<'barriers'>[];
  selectedLearningStyles: LearningStyle[];
  selectedStudentId?: string | null;
  onActivityGenerated: (activity: any) => void;
}
```

#### Usage

```typescript
import { ActivityAIGenerator } from '@/components/ActivityAIGenerator';

const MyComponent = () => {
  const [barriers, setBarriers] = useState([]);
  const [learningStyles, setLearningStyles] = useState([]);
  
  const handleActivityGenerated = (activity) => {
    console.log('Generated activity:', activity);
    // Handle the generated activity
  };

  return (
    <ActivityAIGenerator
      selectedBarriers={barriers}
      selectedLearningStyles={learningStyles}
      selectedStudentId="student-123"
      onActivityGenerated={handleActivityGenerated}
    />
  );
};
```

#### Features

- Real-time AI activity generation using OpenAI
- Chat interface for iterative improvements
- Support for multiple learning styles and barriers
- Student-specific customization
- Activity preview and saving functionality
- Token usage statistics

---

### StudentSelector

**File:** `src/components/StudentSelector.tsx`

Dropdown component for selecting students with search and creation capabilities.

#### Props

```typescript
interface StudentSelectorProps {
  selectedStudent: Student | null;
  onStudentChange: (student: Student) => void;
}

interface Student {
  id: string;
  name: string;
  grade: string;
}
```

#### Usage

```typescript
import { StudentSelector } from '@/components/StudentSelector';

const MyComponent = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <StudentSelector
      selectedStudent={selectedStudent}
      onStudentChange={setSelectedStudent}
    />
  );
};
```

#### Features

- Search functionality for finding students
- Create new students inline
- Grade-based organization
- Keyboard navigation support

---

### InterventionWizard

**File:** `src/components/InterventionWizard.tsx`

Step-by-step wizard for creating educational interventions.

#### Props

```typescript
interface InterventionWizardProps {
  onComplete: (intervention: any) => void;
  onCancel: () => void;
}
```

#### Usage

```typescript
import { InterventionWizard } from '@/components/InterventionWizard';

const MyComponent = () => {
  const handleComplete = (intervention) => {
    console.log('Intervention created:', intervention);
  };

  const handleCancel = () => {
    console.log('Wizard cancelled');
  };

  return (
    <InterventionWizard
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};
```

#### Features

- Multi-step form with validation
- Student selection integration
- Activity and barrier selection
- Progress tracking
- Auto-save functionality

---

### DashboardStats

**File:** `src/components/DashboardStats.tsx`

Statistics dashboard component displaying key metrics.

#### Props

```typescript
interface DashboardStatsProps {
  // Props are internally managed through data fetching
}
```

#### Usage

```typescript
import { DashboardStats } from '@/components/DashboardStats';

const Dashboard = () => {
  return (
    <div>
      <DashboardStats />
    </div>
  );
};
```

#### Features

- Real-time statistics from database
- Activity, intervention, and student counts
- Visual charts and indicators
- Responsive design

---

## Authentication

### AuthProvider

**File:** `src/context/AuthContext.tsx`

Context provider for authentication state management.

#### Context Interface

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
```

#### Usage

```typescript
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Provider setup
function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

// Using the hook
function MyComponent() {
  const { user, session, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      Welcome, {user.email}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

#### Features

- Automatic session management
- Real-time auth state updates
- Loading states
- Sign out functionality

---

### ProtectedRoute

**File:** `src/components/ProtectedRoute.tsx`

Route wrapper that requires authentication.

#### Usage

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Routes>
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/activities" element={<Activities />} />
  </Route>
</Routes>
```

#### Features

- Automatic redirect to login if not authenticated
- Supports nested routes
- Loading state management

---

## Data Layer

### Database Types

**File:** `database.types.ts`

Generated TypeScript types for the Supabase database schema.

#### Main Tables

```typescript
// Activities table
type Activity = Tables<'activities'>;
// {
//   id: string;
//   name: string;
//   objective: string;
//   materials: Json;
//   development: Json;
//   created_by: string;
//   created_at: string;
//   updated_at: string;
// }

// Students table
type Student = Tables<'students'>;
// {
//   id: string;
//   name: string;
//   grade: string;
//   created_by: string;
//   created_at: string;
//   updated_at: string;
// }

// Barriers table
type Barrier = Tables<'barriers'>;
// {
//   id: string;
//   name: string;
//   description: string;
//   created_by: string;
//   created_at: string;
//   updated_at: string;
// }

// Learning Styles table
type LearningStyle = Tables<'learning_styles'>;
// {
//   id: string;
//   name: string;
//   description: string;
//   color: string | null;
//   created_by: string;
//   created_at: string;
//   updated_at: string;
// }

// Interventions table
type Intervention = Tables<'interventions'>;
// {
//   id: string;
//   student_id: string;
//   activity_id: string;
//   teacher_id: string;
//   date: string;
//   observations: string | null;
//   created_at: string;
//   updated_at: string;
// }
```

#### Usage

```typescript
import { Tables } from 'database.types';

// Type-safe database operations
const createActivity = async (activity: TablesInsert<'activities'>) => {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single();
  
  return { data, error };
};
```

---

### Supabase Integration

**File:** `src/integrations/supabase/client.ts`

Supabase client configuration and utilities.

#### Client Setup

```typescript
import { supabase } from '@/integrations/supabase/client';

// Basic queries
const { data: activities, error } = await supabase
  .from('activities')
  .select('*')
  .eq('created_by', userId);

// Insert data
const { data: newActivity, error } = await supabase
  .from('activities')
  .insert({
    name: 'New Activity',
    objective: 'Learning objective',
    materials: [],
    development: {},
    created_by: userId
  })
  .single();

// Update data
const { data: updatedActivity, error } = await supabase
  .from('activities')
  .update({ name: 'Updated Activity' })
  .eq('id', activityId)
  .single();

// Delete data
const { error } = await supabase
  .from('activities')
  .delete()
  .eq('id', activityId);
```

---

## AI Integration

### OpenAI Service

**File:** `src/integrations/openai/service.ts`

Service for generating educational activities using OpenAI.

#### Main Functions

```typescript
import { generateActivity, chatWithEducationalAssistant } from '@/integrations/openai/service';

// Generate a complete activity
const generateNewActivity = async () => {
  const params = {
    barriers: [
      { id: '1', name: 'Attention', description: 'Difficulty maintaining focus' }
    ],
    learningStyles: [
      { id: '1', name: 'Visual', description: 'Learns through visual aids' }
    ],
    customDescription: 'Activity for 8-year-old student',
    selectedModel: 'gpt-4.1-nano'
  };

  const { activity, statistics } = await generateActivity(params);
  
  console.log('Generated activity:', activity);
  console.log('Tokens used:', statistics.tokensUsed);
  console.log('Time taken:', statistics.timeElapsed);
};

// Chat with educational assistant
const chatWithAssistant = async () => {
  const messages = [
    { role: 'user', content: 'How can I help students with ADHD?' }
  ];

  const { response, statistics } = await chatWithEducationalAssistant(messages);
  
  console.log('Assistant response:', response);
  console.log('Statistics:', statistics);
};
```

#### Available Models

```typescript
// Get list of available models
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/integrations/openai/service';

console.log('Available models:', AVAILABLE_MODELS);
console.log('Default model:', DEFAULT_MODEL);
```

#### Types

```typescript
interface ActivityGenerationParams {
  barriers: Array<{id: string; name: string; description: string}>;
  learningStyles: Array<{id: string; name: string; description: string}>;
  customDescription?: string;
  studentInfo?: any;
  selectedModel?: OpenAIModel;
}

interface GeneratedActivity {
  name: string;
  objective: string;
  materials: string[];
  development: {
    steps: Array<{
      description: string;
      duration: string;
    }>;
  };
}

interface ResponseStatistics {
  tokensUsed: number;
  timeElapsed: number;
  model: string;
}
```

---

### MCP Activity Generator

**File:** `src/mcp/activity-generator.ts`

Model Context Protocol integration for activity generation.

#### Functions

```typescript
import { generateActivityMCP, saveGeneratedActivity } from '@/mcp/activity-generator';

// Generate activity using MCP
const generateWithMCP = async () => {
  const input = {
    barriers: [
      { id: '1', name: 'Reading', description: 'Difficulty with reading comprehension' }
    ],
    learningStyles: [
      { id: '1', name: 'Kinesthetic', description: 'Learns through movement' }
    ],
    customDescription: 'Focus on hands-on activities',
    studentInfo: { name: 'John', grade: '3rd' }
  };

  const { activity, statistics } = await generateActivityMCP(input);
  
  console.log('MCP Generated activity:', activity);
  console.log('Generation stats:', statistics);
};

// Save generated activity
const saveActivity = async (activity, userId, barriers, learningStyles) => {
  const savedActivity = await saveGeneratedActivity(
    activity,
    userId,
    barriers,
    learningStyles
  );
  
  console.log('Saved activity:', savedActivity);
};
```

#### Types

```typescript
interface ActivityGenerationInput {
  barriers: Tables<'barriers'>[];
  learningStyles: Tables<'learning_styles'>[];
  customDescription?: string;
  studentInfo?: any;
}

interface GeneratedActivity {
  name: string;
  objective: string;
  materials: string[];
  development: {
    steps: Array<{
      description: string;
      duration: string;
    }>;
  };
}

interface ActivityGenerationResult {
  activity: GeneratedActivity;
  statistics: {
    timeElapsed: number;
    tokensUsed: number;
  };
}
```

---

## UI Components

### Button Component

**File:** `src/components/ui/button.tsx`

Customizable button component with multiple variants.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

#### Usage

```typescript
import { Button } from '@/components/ui/button';

// Different variants
<Button variant="default">Default Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link Button</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔥</Button>

// With icons
<Button>
  <PlusIcon className="h-4 w-4" />
  Add Item
</Button>

// As child component
<Button asChild>
  <a href="/link">Link as Button</a>
</Button>
```

---

### Form Components

The platform includes comprehensive form components built with React Hook Form and Zod validation.

#### Input

```typescript
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### Textarea

```typescript
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Enter description"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
/>
```

#### Select

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox

```typescript
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
  id="terms"
  checked={checked}
  onCheckedChange={setChecked}
/>
<Label htmlFor="terms">Accept terms</Label>
```

---

### Layout Components

#### Card

```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    <p>Tab 1 content</p>
  </TabsContent>
  <TabsContent value="tab2">
    <p>Tab 2 content</p>
  </TabsContent>
</Tabs>
```

#### Dialog

```typescript
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Hooks

### useToast

**File:** `src/hooks/use-toast.ts`

Hook for displaying toast notifications.

#### Usage

```typescript
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
      variant: "default",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  const showCustomToast = () => {
    toast({
      title: "Custom Toast",
      description: "This is a custom toast message.",
      action: (
        <Button variant="outline" size="sm">
          Action
        </Button>
      ),
    });
  };

  return (
    <div>
      <Button onClick={showSuccessToast}>Success Toast</Button>
      <Button onClick={showErrorToast}>Error Toast</Button>
      <Button onClick={showCustomToast}>Custom Toast</Button>
    </div>
  );
};
```

#### Toast Options

```typescript
interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
  duration?: number;
}
```

---

### useMobile

**File:** `src/hooks/use-mobile.tsx`

Hook for detecting mobile devices.

#### Usage

```typescript
import { useMobile } from '@/hooks/use-mobile';

const MyComponent = () => {
  const isMobile = useMobile();

  return (
    <div>
      {isMobile ? (
        <div>Mobile view</div>
      ) : (
        <div>Desktop view</div>
      )}
    </div>
  );
};
```

---

## Utilities

### cn (Class Names)

**File:** `src/lib/utils.ts`

Utility function for conditionally joining classNames.

#### Usage

```typescript
import { cn } from '@/lib/utils';

// Basic usage
const className = cn('base-class', 'another-class');

// Conditional classes
const className = cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
);

// With Tailwind merge
const className = cn(
  'px-4 py-2',
  'px-6', // This will override px-4
  'bg-blue-500',
  isError && 'bg-red-500' // This will override bg-blue-500 when isError is true
);

// In component
const Button = ({ className, isActive, ...props }) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        isActive && 'bg-blue-500 text-white',
        className
      )}
      {...props}
    />
  );
};
```

---

## Types

### Common Types

#### Student Types

```typescript
interface Student {
  id: string;
  name: string;
  grade: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Activity Types

```typescript
interface Activity {
  id: string;
  name: string;
  objective: string;
  materials: Json;
  development: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ActivityDevelopment {
  description: string;
  steps: ActivityStep[];
}

interface ActivityStep {
  id: string;
  description: string;
  duration: string;
}
```

#### Barrier Types

```typescript
interface Barrier {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Learning Style Types

```typescript
interface LearningStyle {
  id: string;
  name: string;
  description: string;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Intervention Types

```typescript
interface Intervention {
  id: string;
  student_id: string;
  activity_id: string;
  teacher_id: string;
  date: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── integrations/       # External service integrations
│   ├── openai/        # OpenAI integration
│   └── supabase/      # Supabase integration
├── lib/               # Utility functions
├── data/              # Sample data and constants
└── mcp/               # Model Context Protocol integration
```

---

## Best Practices

### Component Development

1. **Use TypeScript interfaces** for all props and state
2. **Implement proper error handling** with try-catch blocks
3. **Use the useToast hook** for user notifications
4. **Follow the existing naming conventions** (camelCase for functions, PascalCase for components)
5. **Use the cn utility** for conditional styling

### Data Management

1. **Use Supabase types** for type safety
2. **Implement proper error handling** for database operations
3. **Use React Query** for data fetching and caching
4. **Follow database naming conventions** (snake_case for columns)

### AI Integration

1. **Handle API errors gracefully** with fallback messages
2. **Show loading states** during AI generation
3. **Implement token usage tracking** for cost monitoring
4. **Use appropriate models** for different use cases

---

## Contributing

### Adding New Components

1. Create the component in the appropriate directory
2. Add TypeScript interfaces for props
3. Include proper JSDoc comments
4. Add to the main export file if needed
5. Update this documentation

### Adding New API Endpoints

1. Define types in the appropriate integration file
2. Implement error handling
3. Add usage examples
4. Update the documentation

### Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

This documentation covers all the major public APIs, components, and functions in the educational platform. For specific implementation details, refer to the individual component files and their TypeScript interfaces.