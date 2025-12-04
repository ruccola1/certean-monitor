import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, Trash2, Play, AlertTriangle, FileCheck, XCircle, Eye, EyeOff, ExternalLink, MoreVertical, Edit, Copy, Share2, RefreshCw, Link2, Link2Off, Info, Upload, FileText, Link as LinkIcon, Camera, Mic, Image, File, ChevronDown, ChevronRight } from 'lucide-react';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
import { eventLogService } from '@/services/eventLogService';
import { useNotificationContext } from '@/contexts/NotificationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Component {
  id: string;
  name: string;
  description: string;
  materials: string[];
  function: string;
}

interface Step0Results {
  product_decomposition?: string;
  product_overview?: string;
  research_sources?: number;
  components_count?: number;
  categories?: string[];
  materials?: string[];
  quality_score?: number;
  quality_reasoning?: string;
  is_sufficient?: boolean;
  missing_info?: string[];
  recommendations?: string[];
  improvement_guidance?: string;
  component_completeness?: Array<{
    component_name: string;
    completeness_percentage: number;
    missing_details: string;
  }>;
  // Legacy
  components?: Component[];
  summary?: string;
  processingTime?: string;
  aiModel?: string;
}

interface Step0Payload {
  product_decomposition?: string;
  product_overview?: string;
  product_name?: string;
  product_type?: string;
  target_markets?: string[];
  research_sources?: Array<{ url: string; content?: string }>;
  components?: Component[];
  categories?: string[];
  materials?: string[];
  is_editable?: boolean;
  edited?: boolean;
}

interface ComponentAssessment {
  componentId: string;
  componentName: string;
  complianceRequirements: string[];
  riskLevel: string;
  testingRequired: string[];
}

interface Step1Results {
  compliance_assessment: string;
  word_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  // Legacy structure (not used anymore)
  assessments?: ComponentAssessment[];
  summary?: string;
  processingTime?: string;
  aiModel?: string;
}

interface ComplianceElement {
  id: string;
  name: string;
  type: string;
  applicability: string;
  markets: string[];
  isMandatory: boolean;
}

interface Step2Results {
  compliance_elements: Array<{
    element_designation?: string;
    designation?: string;
    name?: string;
    element_name?: string;
    element_type?: string;
    type?: string;
    element_description_long?: string;
    description?: string;
    element_countries?: string[];
    countries?: string[];
    related_components?: string[];  // Component names this element applies to
    [key: string]: any;
  }>;
  elements_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  raw_response?: string;
  component_element_map?: Record<string, string[]>;  // Component name → Element names
  // Legacy
  complianceElements?: ComplianceElement[];
  totalElements?: number;
  categorizedBy?: string;
}

interface Step3Results {
  compliance_sources: Array<{
    element_name?: string;
    name?: string;
    element_url?: string;
    url?: string;
    element_description?: string;
    description?: string;
    [key: string]: any;
  }>;
  sources_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  raw_response?: string;
}

interface Step4Results {
  compliance_updates: Array<{
    regulation?: string;
    title?: string;
    update_date?: string;
    type?: string;
    description?: string;
    impact?: string;
    compliance_deadline?: string;
    validity?: string;
    [key: string]: any;
  }>;
  updates_count: number;
  model_used: any;
  ai_count: number;
  target_markets?: string[];
  raw_response?: string;
}

interface Step3Payload {
  element_mappings: Array<{
    step2_element_name: string;
    step2_designation: string;
    shared_db_id: string | null;
    shared_db_name: string | null;
    source_official: string | null;
    found: boolean;
  }>;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  type: string;
  manufactured_in?: string[];
  markets: string[];
  target_audience?: ('consumer' | 'business')[];
  status: string;
  step0Status: string;
  step1Status: string;
  step2Status: string;
  step3Status: string;
  step4Status: string;
  createdAt: string;
  step0Results?: Step0Results;
  step0Payload?: Step0Payload;
  step1Results?: Step1Results;
  step2Results?: Step2Results;
  step2Payload?: any;
  step3Payload?: Step3Payload;
  step3Results?: Step3Results;
  step4Results?: Step4Results;
  components?: Component[];
  step0Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step1Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step2Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step3Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step4Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
}

interface ComplianceArea {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export default function Products() {
  const { user } = useAuth0();
  
  // Helper to get user info for event logging
  const getUserInfo = () => ({
    user_id: (user as any)?.sub || 'unknown',
    email: (user as any)?.email || 'unknown@example.com',
    name: (user as any)?.name || (user as any)?.nickname || (user as any)?.email || 'Unknown User'
  });

  // Connect to backend log stream for real-time logs
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://q57c4vz2em.eu-west-1.awsapprunner.com';
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const connectToLogStream = () => {
      try {
        // Note: SSE doesn't support custom headers for auth
        const url = `${API_BASE}/api/logs/stream`;
        
        console.log('%c📡 Connecting to certean-ai log stream...', 'color: #6366f1; font-weight: bold');
        eventSource = new EventSource(url);
        
        eventSource.onopen = () => {
          console.log('%c✅ Connected to certean-ai log stream', 'color: #10b981; font-weight: bold');
        };
        
        eventSource.onmessage = (event) => {
          try {
            const log = JSON.parse(event.data);
            
            // Skip keepalive and separator messages
            if (log.type === 'separator') {
              console.log('%c' + log.message, 'color: #6366f1; font-style: italic');
              return;
            }
            
            // Format and display the log
            const levelColors: Record<string, string> = {
              'DEBUG': '#9ca3af',
              'INFO': '#3b82f6',
              'WARNING': '#f59e0b',
              'ERROR': '#ef4444',
              'CRITICAL': '#dc2626'
            };
            
            const color = levelColors[log.level] || '#6b7280';
            const time = log.timestamp?.split('T')[1]?.split('.')[0] || '';
            const prefix = `[${time}] [${log.level}]`;
            
            // Use different console methods based on level
            if (log.level === 'ERROR' || log.level === 'CRITICAL') {
              console.error(`%c${prefix} ${log.message}`, `color: ${color}`);
            } else if (log.level === 'WARNING') {
              console.warn(`%c${prefix} ${log.message}`, `color: ${color}`);
            } else {
              console.log(`%c${prefix} ${log.message}`, `color: ${color}`);
            }
          } catch {
            // Ignore parse errors
          }
        };
        
        eventSource.onerror = () => {
          // Silently handle disconnections - log streaming is optional
          // The stream will auto-reconnect if needed
          eventSource?.close();

          // Only reconnect if we haven't exceeded retry limit
          if (!reconnectTimeout) {
            console.log('%c⚠️ Log stream disconnected, will reconnect...', 'color: #f59e0b; font-size: 11px');
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectToLogStream();
            }, 5000);
          }
        };
      } catch (error) {
        console.error('Failed to connect to log stream:', error);
      }
    };
    
    // Start connection
    connectToLogStream();
    
    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);
  
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // Track which step details have been loaded (cache)
  const [loadedStepDetails, setLoadedStepDetails] = useState<Map<string, any>>(new Map());
  const [loadingStepDetails, setLoadingStepDetails] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<ProductDetails | null>(null);
  const [complianceAreas, setComplianceAreas] = useState<ComplianceArea[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  // Expanded groups for compliance elements (Legislation, Standards, Markings)
  const [expandedElementGroups, setExpandedElementGroups] = useState<Set<string>>(new Set(['legislation', 'standard', 'marking'])); // All expanded by default
  // const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);
  // Single state to track which step is expanded (only one at a time)
  const [expandedStep, setExpandedStep] = useState<{ productId: string; stepNumber: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: '',
    productName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [newlyAddedProductId, setNewlyAddedProductId] = useState<string | null>(null);
  
  // Component info modal state
  const [componentInfoModal, setComponentInfoModal] = useState<{
    open: boolean;
    componentName: string;
    percentage: number;
    missingDetails: string;
  }>({
    open: false,
    componentName: '',
    percentage: 0,
    missingDetails: ''
  });
  
  // Track which steps are being executed for loading states
  const [executingSteps, setExecutingSteps] = useState<Set<string>>(new Set());
  
  // Edit mode state
  const [editingStep0, setEditingStep0] = useState<{ productId: string } | null>(null);
  const [editingStep2, setEditingStep2] = useState<{ productId: string } | null>(null);
  const [savingStep0, setSavingStep0] = useState(false);
  // savingStep2 removed - not used
  
  // Step 0 edit state (local copies for editing)
  const [step0EditData, setStep0EditData] = useState<any>(null);
  
  // Data Ingestion state for Step 0
  const [dataIngestion, setDataIngestion] = useState<{
    productId: string;
    freeText: string;
    sourceUrls: string[];
    newSourceUrl: string;
    uploadedDocuments: { name: string; size: number; type: string }[];
    uploadedImages: { name: string; size: number; preview?: string }[];
  } | null>(null);
  const [savingDataIngestion, setSavingDataIngestion] = useState(false);
  
  // Component expand/collapse state - tracks which components are expanded per product
  // Format: { productId: Set<componentIndex> } - expanded components stored in a Set
  const [expandedComponents, setExpandedComponents] = useState<Map<string, Set<number>>>(new Map());
  
  // Helper to toggle component expansion
  const toggleComponentExpansion = (productId: string, componentIndex: number) => {
    setExpandedComponents(prev => {
      const newMap = new Map(prev);
      const productExpanded = newMap.get(productId) || new Set();
      const newSet = new Set(productExpanded);
      if (newSet.has(componentIndex)) {
        newSet.delete(componentIndex);
      } else {
        newSet.add(componentIndex);
      }
      newMap.set(productId, newSet);
      return newMap;
    });
  };
  
  // Helper to expand/collapse all components for a product
  const toggleAllComponents = (productId: string, components: any[], expand: boolean) => {
    setExpandedComponents(prev => {
      const newMap = new Map(prev);
      if (expand) {
        // Expand all - add all indices
        const allIndices = new Set(components.map((_, idx) => idx));
        newMap.set(productId, allIndices);
      } else {
        // Collapse all - empty set
        newMap.set(productId, new Set());
      }
      return newMap;
    });
  };
  
  // Refs for file inputs
  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Step 2 edit state
  const [step2EditData, setStep2EditData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [manualElementInput, setManualElementInput] = useState<string>('');
  const [manualElementMarket, setManualElementMarket] = useState<string>('');
  const [manualElementType, setManualElementType] = useState<string>('legislation');
  
  // Filter bar state - single Set for all active filter IDs
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  const { addNotification } = useNotificationContext();
  
  // Filter toggle handler
  const handleToggleFilter = (filterId: string, isChecked: boolean) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (isChecked) {
        newFilters.add(filterId);
      } else {
        newFilters.delete(filterId);
      }
      return newFilters;
    });
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setActiveFilters(new Set());
  };

  // Create dynamic products list for the filterbar (all products)
  const dynamicProductsForFilter = useMemo(() => {
    return products.map(p => ({
      id: p.id,
      name: p.name
    }));
  }, [products]);

  // Filter products based on active product filters
  const filteredProducts = useMemo(() => {
    // Extract product filter IDs from activeFilters (they start with "product_")
    const activeProductFilterIds = Array.from(activeFilters).filter(id => id.startsWith('product_'));
    
    // If no product filters are active, show all products
    if (activeProductFilterIds.length === 0) {
      return products;
    }
    
    // Extract actual product IDs from filter IDs (remove "product_" prefix)
    const selectedProductIds = new Set(
      activeProductFilterIds.map(filterId => filterId.replace('product_', ''))
    );
    
    // Filter products to only show selected ones
    return products.filter(product => selectedProductIds.has(product.id));
  }, [products, activeFilters]);
  
  const previousStatusesRef = useRef<Map<string, {
    step0: string | undefined;
    step1: string | undefined;
    step2: string | undefined;
    step3: string | undefined;
    step4: string | undefined;
  }>>(new Map());
  
  // Track previous step4 results for change detection
  const previousStep4ResultsRef = useRef<Map<string, Step4Results | undefined>>(new Map());
  
  // Track new update counts per product (for badge display)
  const [newUpdateCounts, setNewUpdateCounts] = useState<Map<string, { new: number; changed: number }>>(new Map());
  
  // Track which update IDs are new/changed (for individual update highlighting)
  const [newUpdateIds, setNewUpdateIds] = useState<Map<string, Set<string>>>(new Map());
  
  // Ref to access latest products without triggering useEffect re-runs
  const productsRef = useRef<ProductDetails[]>(products);

  const fetchProducts = async (skipDebounce = false) => {
    try {
      // Don't fetch if user isn't loaded yet
      if (!user?.sub) {
        console.log('User not loaded yet, skipping products fetch');
        return;
      }

      // Debounce check - prevent rapid successive fetches
      if (!skipDebounce) {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
          console.log(`Debouncing: Skipping fetch (${timeSinceLastFetch}ms since last)`);
          return;
        }
        lastFetchTimeRef.current = now;
      }

      // Set API key
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      
      // If no client assigned, show empty workspace
      if (!clientId) {
        console.log('📋 No client assigned - showing empty workspace');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      console.log('⏱️ [PERF] Starting products fetch for client:', clientId);
      const fetchStart = performance.now();
      
      const response = await productService.getAll(clientId, true); // minimal=true for fast loading
      const fetchEnd = performance.now();
      console.log(`⏱️ [PERF] Products API took ${(fetchEnd - fetchStart).toFixed(0)}ms`);
      console.log('Products fetched:', response.data?.length || 0);
      
      // Log response size
      const responseSize = JSON.stringify(response.data).length;
      console.log(`📦 [PERF] Response size: ${(responseSize / 1024).toFixed(1)}KB (minimal mode)`);
      
      const newProducts = (response.data || []) as unknown as ProductDetails[];
      
      // Log detailed progress for any running steps
      newProducts.forEach(product => {
        const runningSteps: string[] = [];
        if (product.step0Status === 'running') runningSteps.push('Step 0');
        if (product.step1Status === 'running') runningSteps.push('Step 1');
        if (product.step2Status === 'running') runningSteps.push('Step 2');
        if (product.step3Status === 'running') runningSteps.push('Step 3');
        if (product.step4Status === 'running') runningSteps.push('Step 4');
        
        if (runningSteps.length > 0) {
          console.group(`🔄 [${product.name}] Running: ${runningSteps.join(', ')}`);
          
          // Log Step 0 progress
          if (product.step0Status === 'running' && product.step0Progress) {
            console.log(`%c[Step 0] ${product.step0Progress.percentage}% - ${product.step0Progress.current}`, 'color: #3b82f6; font-weight: bold');
            if (product.step0Progress.steps?.length > 0) {
              const recentSteps = product.step0Progress.steps.slice(-3);
              recentSteps.forEach(s => console.log(`  └─ ${s.timestamp?.split('T')[1]?.split('.')[0] || ''} ${s.message}`));
            }
          }
          
          // Log Step 1 progress
          if (product.step1Status === 'running' && product.step1Progress) {
            console.log(`%c[Step 1] ${product.step1Progress.percentage}% - ${product.step1Progress.current}`, 'color: #10b981; font-weight: bold');
            if (product.step1Progress.steps?.length > 0) {
              const recentSteps = product.step1Progress.steps.slice(-3);
              recentSteps.forEach(s => console.log(`  └─ ${s.timestamp?.split('T')[1]?.split('.')[0] || ''} ${s.message}`));
            }
          }
          
          // Log Step 2 progress
          if (product.step2Status === 'running' && product.step2Progress) {
            console.log(`%c[Step 2] ${product.step2Progress.percentage}% - ${product.step2Progress.current}`, 'color: #f59e0b; font-weight: bold');
            if (product.step2Progress.steps?.length > 0) {
              const recentSteps = product.step2Progress.steps.slice(-3);
              recentSteps.forEach(s => console.log(`  └─ ${s.timestamp?.split('T')[1]?.split('.')[0] || ''} ${s.message}`));
            }
          }
          
          // Log Step 3 progress
          if (product.step3Status === 'running' && product.step3Progress) {
            console.log(`%c[Step 3] ${product.step3Progress.percentage}% - ${product.step3Progress.current}`, 'color: #8b5cf6; font-weight: bold');
            if (product.step3Progress.steps?.length > 0) {
              const recentSteps = product.step3Progress.steps.slice(-3);
              recentSteps.forEach(s => console.log(`  └─ ${s.timestamp?.split('T')[1]?.split('.')[0] || ''} ${s.message}`));
            }
          }
          
          // Log Step 4 progress
          if (product.step4Status === 'running' && product.step4Progress) {
            console.log(`%c[Step 4] ${product.step4Progress.percentage}% - ${product.step4Progress.current}`, 'color: #ec4899; font-weight: bold');
            if (product.step4Progress.steps?.length > 0) {
              const recentSteps = product.step4Progress.steps.slice(-3);
              recentSteps.forEach(s => console.log(`  └─ ${s.timestamp?.split('T')[1]?.split('.')[0] || ''} ${s.message}`));
            }
          }
          
          console.groupEnd();
        }
      });
      
      console.log('⏱️ [PERF] Setting products state...');
      const renderStart = performance.now();
      setProducts(newProducts);
      productsRef.current = newProducts; // Update ref
      // Measure render time on next tick
      setTimeout(() => {
        const renderEnd = performance.now();
        console.log(`⏱️ [PERF] Render took ${(renderEnd - renderStart).toFixed(0)}ms`);
      }, 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Don't clear products on error - keep showing what we have
      // Only show notification if this is not initial load
      if (!loading) {
        addNotification({
          type: 'error',
          title: 'Failed to Refresh Products',
          message: 'Could not connect to backend. Retrying...',
          productId: '',
          productName: '',
          step: 0,
        });
      }
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  // Keep productsRef in sync with products state
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Debounce mechanism to prevent rapid successive fetches
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between fetches

  useEffect(() => {
    // Wait for user to be loaded before fetching
    if (!user?.sub) {
      console.log('Waiting for user to load...');
      return;
    }

    // Fetch products immediately when user is loaded
    fetchProducts(true); // Skip debounce on initial load
    // Don't fetch compliance areas on mount - lazy load when needed

    // Optimized polling: Poll frequently when steps are running
    const interval = setInterval(() => {
      // Use ref to access latest products without causing re-renders
      const currentProducts = productsRef.current;
      const runningProducts = currentProducts.filter(p => 
        p.step0Status === 'running' || 
        p.step1Status === 'running' || 
        p.step2Status === 'running' || 
        p.step3Status === 'running' || 
        p.step4Status === 'running'
      );
      
      // Only fetch if there are running steps AND enough time has passed
      const now = Date.now();
      if (runningProducts.length > 0 && (now - lastFetchTimeRef.current) >= MIN_FETCH_INTERVAL) {
        console.log(`%c📡 Polling: ${runningProducts.length} product(s) with running steps`, 'color: #6366f1');
        lastFetchTimeRef.current = now;
        fetchProducts();
      }
    }, 5000); // Poll every 5 seconds for faster progress updates

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.sub]); // Only re-run when user changes, NOT when products change

  // Lazy load compliance areas when user expands Step 2
  useEffect(() => {
    // Only fetch if Step 2 is expanded and we haven't loaded compliance areas yet
    if (expandedStep?.stepNumber === 2 && complianceAreas.length === 0) {
      console.log('Lazy loading compliance areas for Step 2 filtering');
      fetchComplianceAreas();
    }
  }, [expandedStep]);

  const fetchComplianceAreas = async () => {
    try {
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Extract client_id from Auth0 user token (use user.sub as client_id)
      const clientId = getClientId(user);
      const response = await apiService.get(`/api/compliance-areas/custom/${clientId}`);
      
      if (response.data && response.data.length > 0) {
        setComplianceAreas(response.data);
      } else {
        // Fallback to default areas
        const defaultResponse = await apiService.get('/api/compliance-areas/default');
        if (defaultResponse.data) {
          setComplianceAreas(defaultResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching compliance areas:', error);
      // Try to get default areas as fallback
      try {
        const defaultResponse = await apiService.get('/api/compliance-areas/default');
        if (defaultResponse.data) {
          setComplianceAreas(defaultResponse.data);
        }
      } catch (e) {
        console.error('Error fetching default compliance areas:', e);
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
  };
  
  // Force refresh when navigating to this page
  useEffect(() => {
    // Only set up listeners if user is loaded
    if (!user?.sub) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts(false); // Use debounce for tab visibility changes
      }
    };
    
    const handleWindowFocus = () => {
      fetchProducts(false); // Use debounce for window focus
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user?.sub]); // Re-run when user loads

  // Helper function to generate a unique key for an update (for comparison)
  const getUpdateKey = (update: any): string => {
    const regulation = update?.regulation || update?.name || '';
    const title = update?.title || '';
    const date = update?.update_date || update?.date || '';
    const description = update?.description || '';
    return `${regulation}|${title}|${date}|${description.slice(0, 100)}`;
  };

  // Helper function to compare step4 results and find new/changed updates
  const compareStep4Results = (
    oldResults: Step4Results | undefined,
    newResults: Step4Results | undefined
  ): { newUpdates: number; changedUpdates: number; newUpdateKeys: Set<string> } => {
    if (!newResults?.compliance_updates) {
      return { newUpdates: 0, changedUpdates: 0, newUpdateKeys: new Set() };
    }

    const newUpdates: string[] = [];
    const changedUpdates: string[] = [];
    const newUpdateKeys = new Set<string>();

    // If no previous results, this is the first run - don't count as new
    if (!oldResults?.compliance_updates || oldResults.compliance_updates.length === 0) {
      return { newUpdates: 0, changedUpdates: 0, newUpdateKeys: new Set() };
    }

    // Build a map of old update keys to their full content
    const oldUpdateMap = new Map<string, any>();
    oldResults.compliance_updates.forEach((update: any) => {
      const key = getUpdateKey(update);
      oldUpdateMap.set(key, update);
    });

    // Compare new updates against old ones
    newResults.compliance_updates.forEach((newUpdate: any) => {
      const key = getUpdateKey(newUpdate);
      
      if (!oldUpdateMap.has(key)) {
        // This is a completely new update
        newUpdates.push(key);
        newUpdateKeys.add(key);
      } else {
        // Check if content changed significantly
        const oldUpdate = oldUpdateMap.get(key);
        const newDesc = newUpdate?.description || '';
        const oldDesc = oldUpdate?.description || '';
        const newImpact = newUpdate?.impact || '';
        const oldImpact = oldUpdate?.impact || '';
        
        if (newDesc !== oldDesc || newImpact !== oldImpact) {
          changedUpdates.push(key);
          newUpdateKeys.add(key);
        }
      }
    });

    return { 
      newUpdates: newUpdates.length, 
      changedUpdates: changedUpdates.length,
      newUpdateKeys 
    };
  };

  // Detect status changes and send notifications
  useEffect(() => {
    products.forEach(product => {
      const productId = product.id;
      const previousStatuses = previousStatusesRef.current.get(productId);
      
      if (!previousStatuses) {
        // First time seeing this product, store its current statuses and step4 results
        previousStatusesRef.current.set(productId, {
          step0: product.step0Status,
          step1: product.step1Status,
          step2: product.step2Status,
          step3: product.step3Status,
          step4: product.step4Status,
        });
        // Store step4 results for future comparison
        previousStep4ResultsRef.current.set(productId, product.step4Results);
        return;
      }
      
      // Check each step for status changes
      const steps = [
        { num: 0, current: product.step0Status, previous: previousStatuses.step0, name: 'Product Data' },
        { num: 1, current: product.step1Status, previous: previousStatuses.step1, name: 'Compliance Assessment' },
        { num: 2, current: product.step2Status, previous: previousStatuses.step2, name: 'Compliance Elements' },
        { num: 3, current: product.step3Status, previous: previousStatuses.step3, name: 'Element Mapping' },
        { num: 4, current: product.step4Status, previous: previousStatuses.step4, name: 'Compliance Updates' },
      ];
      
      steps.forEach(step => {
        // Detect completed steps
        if (step.previous === 'running' && step.current === 'completed') {
          // Special handling for Step 4 - detect update changes
          if (step.num === 4) {
            const previousStep4 = previousStep4ResultsRef.current.get(productId);
            const currentStep4 = product.step4Results;
            
            // Compare results and detect changes
            const { newUpdates, changedUpdates, newUpdateKeys } = compareStep4Results(
              previousStep4,
              currentStep4
            );
            
            const totalChanges = newUpdates + changedUpdates;
            
            if (totalChanges > 0) {
              // Fire an update change notification
              let message = `${product.name}: `;
              if (newUpdates > 0 && changedUpdates > 0) {
                message += `${newUpdates} new and ${changedUpdates} changed updates detected`;
              } else if (newUpdates > 0) {
                message += `${newUpdates} new update${newUpdates > 1 ? 's' : ''} detected`;
              } else {
                message += `${changedUpdates} update${changedUpdates > 1 ? 's' : ''} changed`;
              }

              addNotification({
                type: 'update_change',
                title: 'Compliance Updates Changed',
                message,
                productId: product.id,
                productName: product.name,
                step: 4,
                metadata: {
                  newUpdatesCount: newUpdates,
                  changedUpdatesCount: changedUpdates,
                  isUpdateChange: true,
                },
              });

              // Update the new update counts for badge display
              setNewUpdateCounts(prev => {
                const updated = new Map(prev);
                updated.set(productId, { new: newUpdates, changed: changedUpdates });
                return updated;
              });

              // Update the new update IDs for highlighting
              setNewUpdateIds(prev => {
                const updated = new Map(prev);
                updated.set(productId, newUpdateKeys);
                return updated;
              });
            } else {
              // Step 4 completed with no changes
              addNotification({
                type: 'success',
                title: `${step.name} Completed`,
                message: `${product.name}: ${step.name} finished successfully (no changes)`,
                productId: product.id,
                productName: product.name,
                step: step.num,
              });
            }
            
            // Update stored step4 results for next comparison
            previousStep4ResultsRef.current.set(productId, currentStep4);
          } else {
            // Regular completion notification for other steps
          addNotification({
            type: 'success',
            title: `${step.name} Completed`,
            message: `${product.name}: ${step.name} finished successfully`,
            productId: product.id,
            productName: product.name,
            step: step.num,
          });
          }
        }
        
        // Detect failed steps
        if (step.previous === 'running' && step.current === 'error') {
          addNotification({
            type: 'error',
            title: `${step.name} Failed`,
            message: `${product.name}: ${step.name} encountered an error`,
            productId: product.id,
            productName: product.name,
            step: step.num,
          });
        }
      });
      
      // Update stored statuses
      previousStatusesRef.current.set(productId, {
        step0: product.step0Status,
        step1: product.step1Status,
        step2: product.step2Status,
        step3: product.step3Status,
        step4: product.step4Status,
      });
    });
  }, [products, addNotification]);

  const handleProductAdded = async () => {
    setShowAddDialog(false);
    setProductToDuplicate(null); // Reset duplicate state
    
    // Fetch products and animate the new one
    try {
      const clientId = getClientId(user);
      if (!clientId) return;
      
      const response = await productService.getAll(clientId, true);
      const newProducts = (response.data || []) as unknown as ProductDetails[];
      
      // Find the new product (one that wasn't in our current list)
      const currentIds = new Set(products.map(p => p.id));
      const newProduct = newProducts.find((p) => !currentIds.has(p.id));
      
      if (newProduct) {
        // Set the new product ID for animation
        setNewlyAddedProductId(newProduct.id);
        
        // Update products list
        setProducts(newProducts);
        
        // Clear the animation state after animation completes
        setTimeout(() => {
          setNewlyAddedProductId(null);
        }, 600);
      } else {
        // Fallback: just update products
        setProducts(newProducts);
      }
    } catch (error) {
      console.error('Error fetching products after add:', error);
      fetchProducts(true);
    }
  };

  // Lazy load step details when user expands a step
  const handleToggleStep = async (productId: string, stepNumber: number) => {
    const isCurrentlyExpanded = expandedStep?.productId === productId && expandedStep?.stepNumber === stepNumber;
    
    // If collapsing, just close it
    if (isCurrentlyExpanded) {
      setExpandedStep(null);
      return;
    }
    
    // Expanding - set expanded first for immediate UI feedback
    setExpandedStep({ productId, stepNumber });
    
    // If expanding Step 4, clear the new update counts (user has seen them)
    if (stepNumber === 4) {
      setNewUpdateCounts(prev => {
        const updated = new Map(prev);
        updated.delete(productId);
        return updated;
      });
      setNewUpdateIds(prev => {
        const updated = new Map(prev);
        updated.delete(productId);
        return updated;
      });
    }
    
    // Check if we already have the details loaded
    const cacheKey = `${productId}-step${stepNumber}`;
    if (loadedStepDetails.has(cacheKey)) {
      console.log(`✅ Using cached Step ${stepNumber} details for product ${productId}`);
      return; // Already loaded
    }
    
    // Load step details on-demand
    console.log(`⏱️ [PERF] Lazy loading Step ${stepNumber} details for product ${productId}`);
    setLoadingStepDetails(prev => new Set(prev).add(cacheKey));
    
    try {
      const loadStart = performance.now();
      const clientId = getClientId(user);
      const response = await productService.getStepDetails(productId, stepNumber, clientId);
      const loadEnd = performance.now();
      
      console.log(`⏱️ [PERF] Step ${stepNumber} details loaded in ${(loadEnd - loadStart).toFixed(0)}ms`);
      
      if (response.success && response.data) {
        // Merge step details into the product
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return {
              ...p,
              [`step${stepNumber}Results`]: response.data.results,
              [`step${stepNumber}Payload`]: response.data.payload,
              [`step${stepNumber}Progress`]: response.data.progress,
              ...(stepNumber === 0 && response.data.components ? { components: response.data.components } : {})
            };
          }
          return p;
        }));
        
        // Cache that we've loaded this step
        setLoadedStepDetails(prev => new Map(prev).set(cacheKey, true));
      }
    } catch (error) {
      console.error(`Failed to load Step ${stepNumber} details:`, error);
      addNotification({
        type: 'error',
        title: 'Failed to Load Details',
        message: `Could not load step details. Please try again.`,
        productId,
        productName: '',
        step: stepNumber,
      });
    } finally {
      setLoadingStepDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  };

  const handleRemoveCategory = async (productId: string, category: string) => {
    try {
      await apiService.getInstance().patch(`/api/products/${productId}/remove-category`, {
        category
      });
      console.log('Category removed:', category);
      
      // Log event
      const clientId = getClientId(user);
      const product = products.find(p => p.id === productId);
      await eventLogService.logEvent('categories_configured', productId, product?.name, { action: 'removed', category }, clientId, getUserInfo());
      
      fetchProducts(true); // Skip debounce for user actions
    } catch (error) {
      console.error('Failed to remove category:', error);
    }
  };

  const handleRemoveMaterial = async (productId: string, material: string) => {
    try {
      await apiService.getInstance().patch(`/api/products/${productId}/remove-material`, {
        material
      });
      console.log('Material removed:', material);
      fetchProducts(true); // Skip debounce for user actions
    } catch (error) {
      console.error('Failed to remove material:', error);
    }
  };

  // Step 0 Edit Mode Handlers
  const handleStartEditStep0 = async (productId: string) => {
    console.log('🖊️ Starting edit mode for Step 0, product:', productId);
    let product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    
    // ALWAYS fetch fresh step0 details before editing to ensure latest saved data
    // This prevents stale data issues due to React async state updates
    const cacheKey = `${productId}-step0`;
    console.log('⏱️ Loading fresh Step 0 details before edit...');
    try {
      const clientId = getClientId(user);
      const response = await productService.getStepDetails(productId, 0, clientId);
      
      if (response.success && response.data) {
        // Merge step details into the product state
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return {
              ...p,
              step0Results: response.data.results,
              step0Payload: response.data.payload,
              step0Progress: response.data.progress,
              ...(response.data.components ? { components: response.data.components } : {})
            };
          }
          return p;
        }));
        
        // Update cache
        setLoadedStepDetails(prev => new Map(prev).set(cacheKey, true));
        
        // Use fresh data for edit form
        product = {
          ...product,
          step0Results: response.data.results,
          step0Payload: response.data.payload,
          components: response.data.components || product.components,
        };
      }
    } catch (error) {
      console.error('Failed to load Step 0 details:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Load Details',
        message: 'Could not load product details for editing.',
        productId,
        productName: product?.name || '',
        step: 0,
      });
      return;
    }
    
    if (!product.step0Results) {
      console.error('step0Results not found for product:', productId);
      return;
    }
    
    console.log('Setting edit mode state...');
    // Create editable copy from fresh data
    const editData = {
      categories: [...(product.step0Results.categories || [])],
      materials: [...(product.step0Results.materials || [])],
      product_overview: product.step0Results.product_overview || product.description || '',
      components: [...(product.components || [])],
      research_sources: [...(product.step0Payload?.research_sources || [])],
      product_decomposition: product.step0Results.product_decomposition || '',
    };
    console.log('Edit data:', editData);
    
    // Set both states
    setStep0EditData(editData);
    setEditingStep0({ productId });
    
    console.log('✅ Edit mode state set. editingStep0 should now be:', { productId });
  };

  const handleCancelEditStep0 = () => {
    setEditingStep0(null);
    setStep0EditData(null);
  };

  const handleRemoveStep0Section = (section: string, index?: number) => {
    if (!step0EditData) return;
    
    const updated = { ...step0EditData };
    
    switch (section) {
      case 'category':
        if (index !== undefined) {
          updated.categories = updated.categories.filter((_: any, i: number) => i !== index);
        } else {
          updated.categories = [];
        }
        break;
      case 'material':
        if (index !== undefined) {
          updated.materials = updated.materials.filter((_: any, i: number) => i !== index);
        } else {
          updated.materials = [];
        }
        break;
      case 'overview':
        updated.product_overview = '';
        break;
      case 'component':
        if (index !== undefined) {
          updated.components = updated.components.filter((_: any, i: number) => i !== index);
        } else {
          updated.components = [];
        }
        break;
      case 'sources':
        updated.research_sources = 0;
        break;
      case 'decomposition':
        updated.product_decomposition = '';
        break;
    }
    
    setStep0EditData(updated);
  };

  const handleAddCategory = () => {
    if (!step0EditData) return;
    const newCategory = prompt('Enter category name:');
    if (newCategory && newCategory.trim()) {
      setStep0EditData({
        ...step0EditData,
        categories: [...(step0EditData.categories || []), newCategory.trim()]
      });
    }
  };

  const handleAddMaterial = () => {
    if (!step0EditData) return;
    const newMaterial = prompt('Enter material name:');
    if (newMaterial && newMaterial.trim()) {
      setStep0EditData({
        ...step0EditData,
        materials: [...(step0EditData.materials || []), newMaterial.trim()]
      });
    }
  };

  const handleUpdateCategory = (index: number, newValue: string) => {
    if (!step0EditData) return;
    const updated = { ...step0EditData };
    updated.categories = [...updated.categories];
    updated.categories[index] = newValue;
    setStep0EditData(updated);
  };

  const handleUpdateMaterial = (index: number, newValue: string) => {
    if (!step0EditData) return;
    const updated = { ...step0EditData };
    updated.materials = [...updated.materials];
    updated.materials[index] = newValue;
    setStep0EditData(updated);
  };

  const handleUpdateComponent = (index: number, field: string, value: any) => {
    if (!step0EditData) return;
    const updated = { ...step0EditData };
    updated.components = [...(updated.components || [])];
    if (!updated.components[index]) {
      updated.components[index] = {};
    }
    updated.components[index] = {
      ...updated.components[index],
      [field]: value
    };
    setStep0EditData(updated);
  };

  const handleSaveStep0 = async (productId: string) => {
    if (!step0EditData || !editingStep0) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Set saving state
    setSavingStep0(true);
    
    try {
      const clientId = getClientId(user);
      
      // Update step0Results - preserve edited content
      const step0Results = {
        ...product.step0Results,
        categories: step0EditData.categories,
        materials: step0EditData.materials,
        product_overview: step0EditData.product_overview || undefined,
        research_sources: Array.isArray(step0EditData.research_sources) ? step0EditData.research_sources.length : (step0EditData.research_sources || 0),
        product_decomposition: step0EditData.product_decomposition || undefined,
      };
      
      // Update step0Payload (used by next step) - preserve edited content
      const step0Payload = {
        ...(product.step0Payload || {}),
        categories: step0EditData.categories,
        materials: step0EditData.materials,
        product_overview: step0EditData.product_overview || undefined,
        components: step0EditData.components,
        research_sources: step0EditData.research_sources || undefined,
        product_decomposition: step0EditData.product_decomposition || undefined,
      };
      
      await productService.updateStep0Payload(productId, step0Payload, step0Results, clientId);
      
      // Log event
      await eventLogService.logEvent('step_edited', productId, product.name, { step: 0 }, clientId, getUserInfo());
      
      // IMMEDIATELY update local state with edited values so UI reflects changes
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            step0Results: step0Results,
            step0Payload: step0Payload,
            components: step0EditData.components,
          };
        }
        return p;
      }));
      
      // Mark cache as loaded with the new data
      setLoadedStepDetails(prev => new Map(prev).set(`${productId}-step0`, true));
      
      addNotification({ 
        title: 'Product Data Saved',
        message: 'Your changes have been saved successfully.',
        type: 'success',
        productId: productId,
        productName: product.name,
        step: 0
      });
      
      setEditingStep0(null);
      setStep0EditData(null);
    } catch (error) {
      console.error('Failed to save Step 0:', error);
      addNotification({ 
        title: 'Product Data Update Failed',
        message: 'Failed to save Product Data changes',
        type: 'error',
        productId: productId,
        productName: product.name,
        step: 0
      });
    } finally {
      setSavingStep0(false);
    }
  };

  // Data Ingestion Handlers
  const handleStartDataIngestion = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Load existing data ingestion from product
    const existingData = (product as any).dataIngestion || {};
    setDataIngestion({
      productId,
      freeText: existingData.freeText || '',
      sourceUrls: existingData.sourceUrls || [],
      newSourceUrl: '',
      uploadedDocuments: existingData.uploadedDocuments || [],
      uploadedImages: existingData.uploadedImages || [],
    });
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dataIngestion || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    
    setDataIngestion({
      ...dataIngestion,
      uploadedDocuments: [...dataIngestion.uploadedDocuments, ...newDocs],
    });
    
    // Reset input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dataIngestion || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));
    
    setDataIngestion({
      ...dataIngestion,
      uploadedImages: [...dataIngestion.uploadedImages, ...newImages],
    });
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    if (!dataIngestion) return;
    setDataIngestion({
      ...dataIngestion,
      uploadedDocuments: dataIngestion.uploadedDocuments.filter((_, i) => i !== index),
    });
  };

  const handleRemoveImage = (index: number) => {
    if (!dataIngestion) return;
    // Revoke object URL to free memory
    if (dataIngestion.uploadedImages[index].preview) {
      URL.revokeObjectURL(dataIngestion.uploadedImages[index].preview!);
    }
    setDataIngestion({
      ...dataIngestion,
      uploadedImages: dataIngestion.uploadedImages.filter((_, i) => i !== index),
    });
  };

  const handleCancelDataIngestion = () => {
    setDataIngestion(null);
  };

  const handleAddSourceUrl = () => {
    if (!dataIngestion || !dataIngestion.newSourceUrl.trim()) return;
    
    setDataIngestion({
      ...dataIngestion,
      sourceUrls: [...dataIngestion.sourceUrls, dataIngestion.newSourceUrl.trim()],
      newSourceUrl: '',
    });
  };

  const handleRemoveSourceUrl = (index: number) => {
    if (!dataIngestion) return;
    
    setDataIngestion({
      ...dataIngestion,
      sourceUrls: dataIngestion.sourceUrls.filter((_, i) => i !== index),
    });
  };

  const handleSaveDataIngestion = async () => {
    if (!dataIngestion) return;
    
    const product = products.find(p => p.id === dataIngestion.productId);
    if (!product) return;
    
    setSavingDataIngestion(true);
    
    try {
      const clientId = getClientId(user);
      
      // Prepare data ingestion object
      const dataIngestionPayload = {
        freeText: dataIngestion.freeText,
        sourceUrls: dataIngestion.sourceUrls,
        uploadedDocuments: dataIngestion.uploadedDocuments,
        uploadedImages: dataIngestion.uploadedImages.map(img => ({ name: img.name, size: img.size })), // Don't save preview URLs
        updatedAt: new Date().toISOString(),
      };
      
      // Save to backend via product update
      await apiService.getInstance().patch(`/api/products/${dataIngestion.productId}/data-ingestion`, {
        dataIngestion: dataIngestionPayload,
        client_id: clientId,
      });
      
      // Update local state
      setProducts(prev => prev.map(p => {
        if (p.id === dataIngestion.productId) {
          return {
            ...p,
            dataIngestion: dataIngestionPayload,
          } as any;
        }
        return p;
      }));
      
      addNotification({
        title: 'Data Ingestion Saved',
        message: 'Your additional information has been saved.',
        type: 'success',
        productId: dataIngestion.productId,
        productName: product.name,
        step: 0,
      });
      
      setDataIngestion(null);
      } catch (error) {
      console.error('Failed to save data ingestion:', error);
      addNotification({
        title: 'Save Failed',
        message: 'Failed to save data ingestion. Please try again.',
        type: 'error',
        productId: dataIngestion.productId,
        productName: product.name,
        step: 0,
      });
    } finally {
      setSavingDataIngestion(false);
    }
  };

  const handleSaveAndRerunWithDataIngestion = async () => {
    if (!dataIngestion) return;
    
    const product = products.find(p => p.id === dataIngestion.productId);
    if (!product) return;
    
    const productId = dataIngestion.productId;
    const productName = product.name;
    
    setSavingDataIngestion(true);
    
    try {
      const clientId = getClientId(user);
      
      // Prepare data ingestion object
      const dataIngestionPayload = {
        freeText: dataIngestion.freeText,
        sourceUrls: dataIngestion.sourceUrls,
        uploadedDocuments: dataIngestion.uploadedDocuments,
        uploadedImages: dataIngestion.uploadedImages.map(img => ({ name: img.name, size: img.size })), // Don't save preview URLs
        updatedAt: new Date().toISOString(),
      };
      
      console.log('📝 Saving data ingestion for product:', productId);
      
      // Save to backend
      await apiService.getInstance().patch(`/api/products/${productId}/data-ingestion`, {
        dataIngestion: dataIngestionPayload,
        client_id: clientId,
      });
      
      console.log('✅ Data ingestion saved, now triggering Step 0...');
      
      // Update local state - show running and CLEAR the dataIngestion field
      // (the content has been sent to the backend and will be incorporated into Step 0)
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            dataIngestion: null, // Clear - content will be incorporated into Step 0 output
            step0Status: 'running',
          } as any;
        }
        return p;
      }));
      
      // Close the data ingestion form
      setDataIngestion(null);
      
      addNotification({
        title: 'Data Ingestion Saved',
        message: 'Re-running analysis with your additional information...',
        type: 'info',
        productId: productId,
        productName: productName,
        step: 0,
      });
      
      // Re-run Step 0 with the new data
      // Note: The backend will read dataIngestion at the START and clear it at the END
      // We don't clear it here to avoid race conditions
      try {
        console.log('🚀 Executing Step 0 for product:', productId);
        await productService.executeStep0(productId, clientId);
        console.log('✅ Step 0 execution started successfully');
        // Backend handles clearing dataIngestion when Step 0 completes
        
      } catch (stepError) {
        console.error('❌ Failed to execute Step 0:', stepError);
        // Update status to error
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, step0Status: 'error' } as any;
          }
          return p;
        }));
        addNotification({
          title: 'Analysis Failed',
          message: 'Data was saved but failed to start analysis.',
          type: 'error',
          productId: productId,
          productName: productName,
          step: 0,
        });
      }
      
      // Invalidate cache and refresh
      setLoadedStepDetails(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${productId}-step0`);
        return newMap;
      });
      
      fetchProducts(true);
    } catch (error) {
      console.error('❌ Failed to save data ingestion:', error);
      addNotification({ 
        title: 'Save Failed',
        message: 'Failed to save data ingestion.',
        type: 'error',
        productId: productId,
        productName: productName,
        step: 0,
      });
    } finally {
      setSavingDataIngestion(false);
    }
  };

  // Step 2 Edit Mode Handlers
  const handleStartEditStep2 = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.step2Results) return;
    
    setEditingStep2({ productId });
    // Create editable copy
    setStep2EditData({
      compliance_elements: [...(product.step2Results.compliance_elements || [])],
    });
  };

  const handleCancelEditStep2 = () => {
    setEditingStep2(null);
    setStep2EditData(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setManualElementInput('');
    setManualElementMarket('');
    setManualElementType('legislation');
  };

  const handleRemoveStep2Element = (index: number) => {
    if (!step2EditData) return;
    
    const updated = {
      ...step2EditData,
      compliance_elements: step2EditData.compliance_elements.filter((_: any, i: number) => i !== index),
    };
    
    setStep2EditData(updated);
  };

  const handleSearchComplianceElements = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const clientId = getClientId(user);
      const response = await productService.searchComplianceElements(query, clientId);
      setSearchResults(response.data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search compliance elements:', error);
      setSearchResults([]);
    }
  };

  const handleSelectComplianceElement = (element: any) => {
    if (!step2EditData) return;
    
    // Add element to list
    const newElement = {
      element_name: element.name,
      element_designation: element.designation,
      element_type: element.type || 'legislation',
      element_description_long: element.description,
      element_url: element.source_official,
      element_countries: element.countries || [],
      from_database: true,
    };
    
    const updated = {
      ...step2EditData,
      compliance_elements: [...step2EditData.compliance_elements, newElement],
    };
    
    setStep2EditData(updated);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleAddManualElement = () => {
    if (!manualElementInput.trim() || !step2EditData) return;
    
    // Create element object with user-selected market and type
    const newElement = {
      element_name: manualElementInput.trim(),
      element_designation: manualElementInput.trim(),
      element_type: manualElementType,
      element_countries: manualElementMarket ? [manualElementMarket] : [],
      from_database: false,
      manually_added: true,
    };
    
    const updated = {
      ...step2EditData,
      compliance_elements: [...step2EditData.compliance_elements, newElement],
    };
    
    setStep2EditData(updated);
    setManualElementInput('');
    setManualElementMarket('');
    setManualElementType('legislation');
  };

  const handleSaveStep2 = async (productId: string) => {
    console.log('💾 Saving Step 2 for product:', productId);
    console.log('step2EditData:', step2EditData);
    console.log('editingStep2:', editingStep2);
    
    if (!step2EditData) {
      console.error('No step2EditData to save');
      addNotification({ 
        title: 'Compliance Elements Save Failed',
        message: 'No data to save',
        type: 'error',
        productId: productId,
        productName: 'Unknown',
        step: 2
      });
      return;
    }
    
    if (!editingStep2) {
      console.error('Not in edit mode');
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      addNotification({ 
        title: 'Compliance Elements Save Failed',
        message: 'Product not found',
        type: 'error',
        productId: productId,
        productName: 'Unknown',
        step: 2
      });
      return;
    }
    
    try {
      const clientId = getClientId(user);
      console.log('Using clientId:', clientId);
      
      // Update step2Results
      const step2Results = {
        ...(product.step2Results || {}),
        compliance_elements: step2EditData.compliance_elements || [],
        elements_count: (step2EditData.compliance_elements || []).length,
      };
      
      // Update step2Payload (used by next step) - create if doesn't exist
      const step2Payload = {
        ...(product.step2Payload || {}),
        compliance_elements: step2EditData.compliance_elements || [],
        product_name: product.step2Payload?.product_name || product.name,
        target_markets: product.step2Payload?.target_markets || product.markets || [],
      };
      
      console.log('Calling updateStep2Payload with:', { productId, step2Payload, step2Results, clientId });
      const response = await productService.updateStep2Payload(productId, step2Payload, step2Results, clientId);
      console.log('Save response:', response);
      
      addNotification({ 
        title: 'Compliance Elements Updated',
        message: 'Compliance Elements changes saved successfully',
        type: 'success',
        productId: productId,
        productName: product.name,
        step: 2
      });
      setEditingStep2(null);
      setStep2EditData(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setManualElementInput('');
      setManualElementMarket('');
      setManualElementType('legislation');
      fetchProducts(true); // Skip debounce for user actions
    } catch (error: any) {
      console.error('Failed to save Step 2:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      addNotification({ 
        title: 'Compliance Elements Update Failed',
        message: error?.response?.data?.detail || error?.message || 'Failed to save Compliance Elements changes',
        type: 'error',
        productId: productId,
        productName: product.name,
        step: 2
      });
    }
  };

  const handleStartStep0 = async (productId: string) => {
    const stepKey = `${productId}-step0`;
    
    // GUARD: Prevent multiple clicks
    if (executingSteps.has(stepKey)) {
      return;
    }
    
    try {
      // 1. Add to executing set for loading state
      setExecutingSteps(prev => new Set(prev).add(stepKey));
      
      // 2. INSTANT UI UPDATE - Set status to running
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, step0Status: 'running' }
          : p
      ));
      
      // 3. Show immediate notification
      const product = products.find(p => p.id === productId);
      addNotification({
        title: 'Analysis Started',
        message: 'Product analysis is now running...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 0
      });
      
      // 4. Backend sync in background (no await blocking)
      const clientId = getClientId(user);
      console.log('🚀 Starting Step 0 for product:', productId);
      
      productService.executeStep0(productId, clientId)
        .then(async () => {
          console.log('✅ Step 0 started successfully');
          
          // Log event
          const product = products.find(p => p.id === productId);
          await eventLogService.logEvent('step_executed', productId, product?.name, { step: 0 }, clientId, getUserInfo());
          
          fetchProducts(true); // Skip debounce after step execution
        })
        .catch(error => {
          console.error('❌ Failed to start Step 0:', error);
          
          // Rollback on error
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, step0Status: 'error' }
              : p
          ));
          
          addNotification({
            title: 'Analysis Failed',
            message: error instanceof Error ? error.message : 'Failed to start analysis',
            type: 'error',
            productId: productId,
            productName: product?.name || 'Unknown',
            step: 0
          });
        })
        .finally(() => {
          // Remove from executing set
          setExecutingSteps(prev => {
            const next = new Set(prev);
            next.delete(stepKey);
            return next;
          });
        });
      
    } catch (error) {
      console.error('❌ Failed to start Step 0:', error);
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const handleStartStep1 = async (productId: string) => {
    const stepKey = `${productId}-step1`;
    
    // GUARD: Prevent multiple clicks
    if (executingSteps.has(stepKey)) {
      return;
    }
    
    try {
      // 1. Add to executing set for loading state
      setExecutingSteps(prev => new Set(prev).add(stepKey));
      
      // 2. INSTANT UI UPDATE - Set status to running
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, step1Status: 'running' }
          : p
      ));
      
      // 3. Show immediate notification
      const product = products.find(p => p.id === productId);
      addNotification({
        title: 'Regulation Search Started',
        message: 'Searching for applicable regulations...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 1
      });
      
      // 4. Backend sync in background (no await blocking)
      const clientId = getClientId(user);
      
      productService.executeStep1(productId, clientId)
        .then(async (response) => {
          console.log('Step 1 started for product:', productId, response.data);
          
          // Log event
          const product = products.find(p => p.id === productId);
          await eventLogService.logEvent('step_executed', productId, product?.name, { step: 1 }, clientId, getUserInfo());
          
          fetchProducts(true); // Skip debounce after step execution
        })
        .catch(error => {
          console.error('Failed to start Step 1:', error);
          
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, step1Status: 'error' }
              : p
          ));
          
          addNotification({
            title: 'Regulation Search Failed',
            message: error?.response?.data?.detail || 'Failed to start regulation search',
            type: 'error',
            productId: productId,
            productName: product?.name || 'Unknown',
            step: 1
          });
        })
        .finally(() => {
          setExecutingSteps(prev => {
            const next = new Set(prev);
            next.delete(stepKey);
            return next;
          });
        });
      
    } catch (error) {
      console.error('Failed to start Step 1:', error);
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const handleStartStep2 = async (productId: string) => {
    const stepKey = `${productId}-step2`;
    
    // GUARD: Prevent multiple clicks
    if (executingSteps.has(stepKey)) {
      return;
    }
    
    try {
      // 1. Add to executing set for loading state
      setExecutingSteps(prev => new Set(prev).add(stepKey));
      
      // 2. INSTANT UI UPDATE - Set status to running
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, step2Status: 'running' }
          : p
      ));
      
      // 3. Show immediate notification
      const product = products.find(p => p.id === productId);
      addNotification({
        title: 'Compliance Analysis Started',
        message: 'Analyzing compliance requirements...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 2
      });
      
      // 4. Backend sync in background (no await blocking)
      const clientId = getClientId(user);
      
      productService.executeStep2(productId, clientId)
        .then(async (response) => {
          console.log('Step 2 started for product:', productId, response.data);
          
          // Log event
          const product = products.find(p => p.id === productId);
          await eventLogService.logEvent('step_executed', productId, product?.name, { step: 2 }, clientId, getUserInfo());
          
          fetchProducts(true); // Skip debounce after step execution
        })
        .catch(error => {
          console.error('Failed to start Step 2:', error);
          
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, step2Status: 'error' }
              : p
          ));
          
          addNotification({
            title: 'Compliance Analysis Failed',
            message: error?.response?.data?.detail || 'Failed to start compliance analysis',
            type: 'error',
            productId: productId,
            productName: product?.name || 'Unknown',
            step: 2
          });
        })
        .finally(() => {
          setExecutingSteps(prev => {
            const next = new Set(prev);
            next.delete(stepKey);
            return next;
          });
        });
      
    } catch (error) {
      console.error('Failed to start Step 2:', error);
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const handleStartStep3 = async (productId: string) => {
    const stepKey = `${productId}-step3`;
    
    // GUARD: Prevent multiple clicks
    if (executingSteps.has(stepKey)) {
      return;
    }
    
    try {
      // 1. Add to executing set for loading state
      setExecutingSteps(prev => new Set(prev).add(stepKey));
      
      // 2. INSTANT UI UPDATE - Set status to running
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, step3Status: 'running' }
          : p
      ));
      
      // 3. Show immediate notification
      const product = products.find(p => p.id === productId);
      addNotification({
        title: 'Gap Analysis Started',
        message: 'Analyzing compliance gaps...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 3
      });
      
      // 4. Backend sync in background (no await blocking)
      const clientId = getClientId(user);
      
      productService.executeStep3(productId, clientId)
        .then(async (response) => {
          console.log('Step 3 started for product:', productId, response.data);
          
          // Log event
          const product = products.find(p => p.id === productId);
          await eventLogService.logEvent('step_executed', productId, product?.name, { step: 3 }, clientId, getUserInfo());
          
          fetchProducts(true); // Skip debounce after step execution
        })
        .catch(error => {
          console.error('Failed to start Step 3:', error);
          
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, step3Status: 'error' }
              : p
          ));
          
          addNotification({
            title: 'Gap Analysis Failed',
            message: error?.response?.data?.detail || 'Failed to start gap analysis',
            type: 'error',
            productId: productId,
            productName: product?.name || 'Unknown',
            step: 3
          });
        })
        .finally(() => {
          setExecutingSteps(prev => {
            const next = new Set(prev);
            next.delete(stepKey);
            return next;
          });
        });
      
    } catch (error) {
      console.error('Failed to start Step 3:', error);
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const handleStartStep4 = async (productId: string) => {
    const stepKey = `${productId}-step4`;
    
    // GUARD: Prevent multiple clicks
    if (executingSteps.has(stepKey)) {
      return;
    }
    
    try {
      // 1. Add to executing set for loading state
      setExecutingSteps(prev => new Set(prev).add(stepKey));
      
      // 2. INSTANT UI UPDATE - Set status to running
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, step4Status: 'running' }
          : p
      ));
      
      // 3. Show immediate notification
      const product = products.find(p => p.id === productId);
      addNotification({
        title: 'Report Generation Started',
        message: 'Generating compliance report...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 4
      });
      
      // 4. Backend sync in background (no await blocking)
      const clientId = getClientId(user);
      
      productService.executeStep4(productId, clientId)
        .then(async (response) => {
          console.log('Step 4 started for product:', productId, response.data);
          
          // Log event
          const product = products.find(p => p.id === productId);
          await eventLogService.logEvent('step_executed', productId, product?.name, { step: 4 }, clientId, getUserInfo());
          
          fetchProducts(true); // Skip debounce after step execution
        })
        .catch(error => {
          console.error('Failed to start Step 4:', error);
          
          setProducts(prev => prev.map(p => 
            p.id === productId 
              ? { ...p, step4Status: 'error' }
              : p
          ));
          
          addNotification({
            title: 'Report Generation Failed',
            message: error?.response?.data?.detail || 'Failed to generate compliance report',
            type: 'error',
            productId: productId,
            productName: product?.name || 'Unknown',
            step: 4
          });
        })
        .finally(() => {
          setExecutingSteps(prev => {
            const next = new Set(prev);
            next.delete(stepKey);
            return next;
          });
        });
      
    } catch (error) {
      console.error('Failed to start Step 4:', error);
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const handleRerunAll = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    
    try {
      addNotification({
        title: 'Re-running All Steps',
        message: 'Starting complete workflow from Step 0 to Step 4...',
        type: 'info',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 0
      });
      
      // Log event
      const clientId = getClientId(user);
      await eventLogService.logEvent('step_rerun', productId, product?.name, { step: 'all' }, clientId, getUserInfo());

      // Run steps sequentially: 0 -> 1 -> 2 -> 3 -> 4
      await handleStartStep0(productId);
      
      // Wait for Step 0 to complete (poll status)
      await waitForStepCompletion(productId, 0);
      
      await handleStartStep1(productId);
      await waitForStepCompletion(productId, 1);
      
      await handleStartStep2(productId);
      await waitForStepCompletion(productId, 2);
      
      await handleStartStep3(productId);
      await waitForStepCompletion(productId, 3);
      
      await handleStartStep4(productId);
      await waitForStepCompletion(productId, 4);
      
      addNotification({
        title: 'All Steps Completed',
        message: 'Complete workflow finished successfully!',
        type: 'success',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 4
      });
    } catch (error) {
      console.error('Failed to complete workflow:', error);
      addNotification({
        title: 'Workflow Failed',
        message: 'One or more steps failed during execution',
        type: 'error',
        productId: productId,
        productName: product?.name || 'Unknown',
        step: 0
      });
    }
  };


  const waitForStepCompletion = async (productId: string, step: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 120; // 10 minutes max (5 sec intervals)
      let attempts = 0;
      
      const checkStatus = async () => {
        try {
          const response = await apiService.getInstance().get(`/api/products?client_id=${getClientId(user)}`);
          const productData = response.data.data || response.data;
          const product = productData.find((p: any) => p.id === productId || p._id === productId);
          
          if (!product) {
            reject(new Error('Product not found'));
            return;
          }
          
          const stepStatus = product[`step${step}Status`]?.toLowerCase();
          
          if (stepStatus === 'completed') {
            resolve();
          } else if (stepStatus === 'error' || stepStatus === 'failed') {
            reject(new Error(`Step ${step} failed`));
          } else if (attempts >= maxAttempts) {
            reject(new Error(`Step ${step} timeout`));
          } else {
            attempts++;
            setTimeout(checkStatus, 5000); // Check every 5 seconds
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  };

  const handleStopStep = async (productId: string, step: 0 | 1 | 2 | 3 | 4) => {
    const stepKey = `${productId}-step${step}`;
    
    try {
      await productService.stopStep(productId, step);
      
      // Remove from executing steps
      setExecutingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
      
      // Refresh products to get updated status
      fetchProducts(true); // Skip debounce after deletion
      
      addNotification({
        title: 'Step Stopped',
        message: `Step ${step} has been cancelled.`,
        type: 'info',
        productId,
        productName: products.find(p => p.id === productId)?.name || 'Product',
        step
      });
    } catch (error) {
      console.error(`Failed to stop Step ${step}:`, error);
      
      addNotification({
        title: 'Stop Failed',
        message: `Failed to stop Step ${step}. It may have already completed.`,
        type: 'error',
        productId,
        productName: products.find(p => p.id === productId)?.name || 'Product',
        step
      });
    }
  };

  const openDeleteDialog = (productId: string, productName: string) => {
    setDeleteDialog({ open: true, productId, productName });
  };

  const confirmDelete = async () => {
    const productIdToDelete = deleteDialog.productId;
    const productNameToDelete = deleteDialog.productName;
    
    setIsDeleting(true);
    
    try {
      // 1. Close dialog immediately
      setDeleteDialog({ open: false, productId: '', productName: '' });
      
      // 2. Start exit animation
      setDeletingProductId(productIdToDelete);
      
      // 3. Backend sync in background (don't wait)
      productService.delete(productIdToDelete)
        .then(async () => {
      console.log('Product deleted:', productIdToDelete);
      
      // Log event
      const clientId = getClientId(user);
      console.log('🔍 Logging event - product_deleted:', { productIdToDelete, productNameToDelete, clientId });
          await eventLogService.logEvent('product_deleted', productIdToDelete, productNameToDelete, {}, clientId, getUserInfo());
        })
        .catch((error) => {
      console.error('Failed to delete product:', error);
      
          // ROLLBACK on failure - restore the list
          setDeletingProductId(null);
      fetchProducts(true); // Skip debounce on error recovery
      
      // Show error notification
      addNotification({
        title: 'Delete Failed',
        message: `Failed to delete ${productNameToDelete}. Please try again.`,
        type: 'error',
        productId: productIdToDelete,
        productName: productNameToDelete,
        step: 0
      });
        });
      
      // 4. Wait for animation to complete (300ms), then remove from UI
      setTimeout(() => {
        setProducts(prev => prev.filter(p => p.id !== productIdToDelete));
        setDeletingProductId(null);
      }, 300);
      
    } catch (error) {
      console.error('Failed to delete product:', error);
      setDeletingProductId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    // Default to 'pending' if status is undefined
    const displayStatus = status || 'pending';
    
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-200 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      complete: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
    };

    return (
      <Badge className={`${statusColors[displayStatus] || 'bg-gray-200 text-gray-700'} border-0`}>
        {displayStatus === 'running' || displayStatus === 'processing' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : null}
        {displayStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-view-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-view-background">
      {/* Filter Bar - Full width, directly under Topbar */}
      <ProductFilterbar
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={handleClearFilters}
        dynamicProducts={dynamicProductsForFilter}
      />
      
      <div className="p-4 md:p-8">
      <div className="max-w-7xl space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
              Products
            </h1>
            <p className="text-sm md:text-[15px] text-gray-500 mt-1 md:mt-2">
              Manage your products and their compliance status
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products List */}
        {!initialLoadComplete ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
            <span className="ml-3 text-gray-500">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <Card className="bg-white border-0 shadow-subtle">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">No products yet</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-white border-0 shadow-subtle">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">No products match the selected filters</p>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="border-0 bg-gray-100 hover:bg-gray-200"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Show filter message if products are filtered */}
            {activeFilters.size > 0 && filteredProducts.length < products.length && (
              <div className="text-sm text-gray-500 mb-2">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            )}
            {filteredProducts.map((product) => {
              const step0Status = product.step0Status || 'pending';
              const step1Status = product.step1Status || 'pending';
              const step2Status = product.step2Status || 'pending';
              const step3Status = product.step3Status || 'pending';
              const step4Status = product.step4Status || 'pending';
              const step0StatusLower = step0Status.toLowerCase();
              const step1StatusLower = step1Status.toLowerCase();
              const step2StatusLower = step2Status.toLowerCase();
              const step3StatusLower = step3Status.toLowerCase();
              const step4StatusLower = step4Status.toLowerCase();
              
              // Check if steps are being executed (for loading states)
              const isExecutingStep0 = executingSteps.has(`${product.id}-step0`);
              const isExecutingStep1 = executingSteps.has(`${product.id}-step1`);
              const isExecutingStep2 = executingSteps.has(`${product.id}-step2`);
              const isExecutingStep3 = executingSteps.has(`${product.id}-step3`);
              // isExecutingStep4 removed - not used in simplified button logic
              
              const complianceElementsCount =
                product.step2Results?.elements_count ??
                product.step2Results?.compliance_elements?.length ??
                0;
              const complianceUpdatesCount =
                product.step4Results?.updates_count ??
                product.step4Results?.compliance_updates?.length ??
                0;
              const isStep0Expanded =
                expandedStep?.productId === product.id &&
                expandedStep?.stepNumber === 0;
              const isStep2Expanded =
                expandedStep?.productId === product.id &&
                expandedStep?.stepNumber === 2;
              const isStep4Expanded =
                expandedStep?.productId === product.id &&
                expandedStep?.stepNumber === 4;
              const isStep2Running =
                step2StatusLower === 'running' || step2StatusLower === 'processing';
              const isStep3Running =
                step3StatusLower === 'running' || step3StatusLower === 'processing';
              const isStep4Running =
                step4StatusLower === 'running' || step4StatusLower === 'processing';

              const isBeingDeleted = deletingProductId === product.id;
              const isNewlyAdded = newlyAddedProductId === product.id;

              return (
              <Card 
                key={product.id} 
                className={`bg-white border-0 shadow-subtle transition-all duration-300 ease-out ${
                  isBeingDeleted 
                    ? 'opacity-0 scale-95 -translate-x-4 overflow-hidden' 
                    : isNewlyAdded
                    ? 'animate-slide-in-right'
                    : 'opacity-100 scale-100 translate-x-0'
                }`}
                style={{
                  maxHeight: isBeingDeleted ? '0px' : 'none',
                  marginBottom: isBeingDeleted ? '0px' : undefined,
                  padding: isBeingDeleted ? '0px' : undefined,
                }}
              >
                <CardContent className="p-3 md:p-6 relative">
                  {/* Main wrapper with relative positioning for action buttons */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[hsl(var(--dashboard-link-color))]">
                          {product.name}
                        </h3>
                        {getStatusBadge(product.status)}
                        {product.step4Status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Monitored
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="border-0 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Not Monitored
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {(() => {
                          // Remove product name prefix from description if present
                          const desc = product.description || '';
                          const namePrefix = `${product.name}: `;
                          if (desc.startsWith(namePrefix)) {
                            return desc.substring(namePrefix.length);
                          }
                          return desc;
                        })()}
                      </p>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm">
                        {/* Categories - show if available from step0Results */}
                        {product.step0Results?.categories && product.step0Results.categories.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Categories:</span>
                            <div className="flex flex-wrap gap-1">
                              {product.step0Results.categories.slice(0, 3).map((category: string, idx: number) => (
                                <Badge key={idx} className="bg-blue-100 text-blue-700 border-0 text-xs">
                                  {category}
                                </Badge>
                              ))}
                              {product.step0Results.categories.length > 3 && (
                                <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                  +{product.step0Results.categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 text-[hsl(var(--dashboard-link-color))] font-medium">
                            {product.type ? product.type.charAt(0).toUpperCase() + product.type.slice(1) : ''}
                          </span>
                        </div>
                        {product.manufactured_in && product.manufactured_in.length > 0 && (
                        <div>
                            <span className="text-gray-500">Manufactured in:</span>
                            <span className="ml-2 text-[hsl(var(--dashboard-link-color))] font-medium">
                              {product.manufactured_in.join(', ')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Target Markets:</span>
                          <span className="ml-2 text-[hsl(var(--dashboard-link-color))] font-medium">
                            {product.markets.join(', ')}
                          </span>
                        </div>
                        {product.target_audience && product.target_audience.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Audience:</span>
                            <div className="flex flex-wrap gap-1">
                              {product.target_audience.map((audience, idx) => (
                                <Badge key={idx} className="bg-teal-100 text-teal-700 border-0 text-xs">
                                  {audience.charAt(0).toUpperCase() + audience.slice(1)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-1 md:gap-3 pb-2 w-full">
                          {/* Step 0 summary */}
                          <div className="bg-slate-100/90 border-0 p-2 md:p-4 h-full overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                  Product Data
                                </p>
                                <div className="flex items-baseline gap-2">
                                  {product.step0Results?.quality_score !== undefined && product.step0Results.quality_score > 0 ? (
                                    <>
                                      <p className={`text-sm md:text-2xl font-mono font-bold ${
                                        product.step0Results.quality_score >= 90 ? 'text-green-600' :
                                        product.step0Results.quality_score >= 75 ? 'text-blue-600' :
                                        product.step0Results.quality_score >= 50 ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {product.step0Results.quality_score}%
                                      </p>
                                      <span className="text-[10px] text-gray-400 hidden md:inline">Provided</span>
                                    </>
                                  ) : (
                                    <p className="text-sm md:text-2xl font-mono text-gray-500 truncate">
                                      {step0Status === 'running' ? '-' : step0Status === 'completed' ? 'Pending' : step0Status.toUpperCase()}
                                    </p>
                                  )}
                                </div>
                                <p className="hidden md:block text-xs text-gray-500 mt-1 truncate">
                                  {product.step0Results?.is_sufficient !== undefined 
                                    ? (product.step0Results.is_sufficient ? "Sufficient" : "Insufficient")
                                    : (product.step0Results?.quality_score 
                                      ? (product.step0Results.quality_score >= 70 ? "Sufficient" : "Insufficient")
                                      : "Pending"
                                    )
                                  }
                                </p>
                              </div>
                              <div className="scale-75 origin-top-left md:scale-100 shrink-0">
                                {getStatusBadge(product.step0Status)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStep(product.id, 0)}
                                className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                              >
                                <span className="md:hidden">View</span>
                                <span className="hidden md:inline">{isStep0Expanded ? 'Hide details' : 'View details'}</span>
                              </Button>
                              {(step0StatusLower === 'completed' || step0StatusLower === 'error') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartStep0(product.id)}
                                  disabled={isExecutingStep0}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  {isExecutingStep0 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <span className="md:hidden">{isExecutingStep0 ? 'Starting...' : 'Re-run'}</span>
                                  <span className="hidden md:inline">{isExecutingStep0 ? 'Starting analysis...' : 'Re-run analysis'}</span>
                                </Button>
                              )}
                              {step0StatusLower === 'running' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStopStep(product.id, 0)}
                                  className="bg-transparent hover:bg-transparent text-black p-0 h-6 w-6 md:h-7 md:w-7"
                                  title="Stop Step 0"
                                >
                                  ■
                                </Button>
                              )}
                              {/* Continue button - run next incomplete step */}
                              {(() => {
                                // Find next step to run
                                if (step0StatusLower !== 'completed') return null;
                                if (step1StatusLower !== 'completed' && step1StatusLower !== 'running') {
                                  return (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep1(product.id)}
                                  disabled={isExecutingStep1}
                                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep1 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                      <Play className="w-3 h-3 mr-1" />
                                      <span>Step 1</span>
                                    </Button>
                                  );
                                }
                                if (step1StatusLower === 'completed' && step2StatusLower !== 'completed' && !isStep2Running) {
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStartStep2(product.id)}
                                      disabled={isExecutingStep2}
                                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                    >
                                      {isExecutingStep2 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                      <Play className="w-3 h-3 mr-1" />
                                      <span>Step 2</span>
                                    </Button>
                                  );
                                }
                                if (step2StatusLower === 'completed' && step3StatusLower !== 'completed' && !isStep3Running) {
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStartStep3(product.id)}
                                      disabled={isExecutingStep3}
                                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                    >
                                      {isExecutingStep3 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                      <Play className="w-3 h-3 mr-1" />
                                      <span>Step 3</span>
                                    </Button>
                                  );
                                }
                                if (step3StatusLower === 'completed' && step4StatusLower !== 'completed' && !isStep4Running) {
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStartStep4(product.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      <span>Step 4</span>
                                    </Button>
                                  );
                                }
                                return null;
                              })()}
                              {/* Re-run Step 1 button */}
                              {step1StatusLower === 'completed' && step0StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartStep1(product.id)}
                                  disabled={isExecutingStep1}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep1 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">Re-run</span>
                                  <span className="hidden md:inline">Re-run Step 1</span>
                                </Button>
                              )}
                              {step1StatusLower === 'running' && (
                                <div className="flex items-center gap-1">
                                  <Button size="sm" disabled className="text-[10px] md:text-xs px-2 h-6 md:h-7 w-full md:w-auto">
                                    <Loader2 className="w-3 h-3 mr-1 md:mr-2 animate-spin" />
                                    <span className="md:hidden">Running...</span>
                                    <span className="hidden md:inline">Assessing compliance...</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStopStep(product.id, 1)}
                                    className="bg-transparent hover:bg-transparent text-black p-0 h-6 w-6 md:h-7 md:w-7"
                                    title="Stop Step 1"
                                  >
                                    ■
                                  </Button>
                                </div>
                              )}
                            </div>
                            {/* Source Link - Bottom Right of Step 0 box */}
                            <div className="flex justify-end mt-2">
                              <button
                                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                title={(product as any).plmLinked ? "Source Linked" : "Link external source (PLM, BOM, Suppliers etc)"}
                              >
                                {(product as any).plmLinked ? (
                                  <>
                                    <Link2 className="w-3 h-3" />
                                    <span>Source Linked</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2Off className="w-3 h-3" />
                                    <span>Source (PLM, BOM, Suppliers etc)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Combined Compliance Elements & Updates */}
                          <div className="bg-slate-100/90 border-0 p-2 md:p-4 h-full overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <div className="flex items-center gap-2">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                    Compliance
                                  </p>
                                  {(() => {
                                    const updateCounts = newUpdateCounts.get(product.id);
                                    const totalNew = (updateCounts?.new || 0) + (updateCounts?.changed || 0);
                                    if (totalNew > 0) {
                                      return (
                                        <Badge className="bg-orange-500 text-white border-0 text-[8px] md:text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                          {totalNew} new
                                        </Badge>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <p className="text-sm md:text-2xl font-mono text-[hsl(var(--dashboard-link-color))]">
                                  {complianceElementsCount}
                                </p>
                                  <span className="text-[10px] md:text-sm text-gray-400">elements</span>
                                  <span className="text-gray-300 mx-1">|</span>
                                  <p className="text-sm md:text-2xl font-mono text-[hsl(var(--dashboard-link-color))]">
                                    {complianceUpdatesCount}
                                  </p>
                                  <span className="text-[10px] md:text-sm text-gray-400">updates</span>
                              </div>
                                <p className="hidden md:block text-xs text-gray-500 mt-1">
                                  {step2StatusLower === 'completed' && step4StatusLower === 'completed' 
                                    ? 'fully analyzed' 
                                    : step2StatusLower === 'completed' 
                                      ? 'elements found, updates pending' 
                                      : 'pending analysis'}
                                </p>
                              </div>
                              <div className="scale-75 origin-top-left md:scale-100 shrink-0 flex flex-col gap-1">
                                {getStatusBadge(step2StatusLower === 'completed' && step4StatusLower === 'completed' ? 'completed' : 
                                  (step2StatusLower === 'running' || step4StatusLower === 'running' || isStep3Running) ? 'running' :
                                  step2StatusLower === 'error' || step4StatusLower === 'error' ? 'error' : 'pending')}
                            </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-3">
                              {/* View Elements button */}
                              {step2StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStep(product.id, 2)}
                                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  <span className="md:hidden">Elements</span>
                                  <span className="hidden md:inline">{isStep2Expanded ? 'Hide elements' : 'View elements'}</span>
                                </Button>
                              )}
                              {/* View Updates button */}
                              {step4StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStep(product.id, 4)}
                                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  <span className="md:hidden">Updates</span>
                                  <span className="hidden md:inline">{isStep4Expanded ? 'Hide updates' : 'View updates'}</span>
                                </Button>
                              )}
                              {/* Running states */}
                              {(isStep2Running || isStep3Running || isStep4Running) && (
                                <div className="flex items-center gap-1">
                                  <Button size="sm" disabled className="text-[10px] md:text-xs px-2 h-6 md:h-7">
                                    <Loader2 className="w-3 h-3 mr-1 md:mr-2 animate-spin" />
                                    <span className="md:hidden">Running...</span>
                                    <span className="hidden md:inline">
                                      {isStep2Running ? 'Finding elements...' : isStep3Running ? 'Finding sources...' : 'Identifying updates...'}
                                    </span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStopStep(product.id, isStep2Running ? 2 : isStep3Running ? 3 : 4)}
                                    className="bg-transparent hover:bg-transparent text-black p-0 h-6 w-6 md:h-7 md:w-7"
                                    title="Stop"
                                  >
                                    ■
                                  </Button>
                                </div>
                              )}
                              {/* Start Step 2 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step2StatusLower !== 'completed' && step1StatusLower === 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep2(product.id)}
                                  disabled={isExecutingStep2}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep2 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <Play className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">{isExecutingStep2 ? '...' : 'Step 2'}</span>
                                  <span className="hidden md:inline">{isExecutingStep2 ? 'Starting...' : 'Run Step 2'}</span>
                                </Button>
                              )}
                              {/* Re-run Step 2 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step2StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartStep2(product.id)}
                                  disabled={isExecutingStep2}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep2 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">Re-run</span>
                                  <span className="hidden md:inline">Re-run Step 2</span>
                                </Button>
                              )}
                              {/* Start Step 3 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step2StatusLower === 'completed' && step3StatusLower !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep3(product.id)}
                                  disabled={isExecutingStep3}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep3 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <Play className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">{isExecutingStep3 ? '...' : 'Step 3'}</span>
                                  <span className="hidden md:inline">{isExecutingStep3 ? 'Starting...' : 'Run Step 3'}</span>
                                </Button>
                              )}
                              {/* Re-run Step 3 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step3StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartStep3(product.id)}
                                  disabled={isExecutingStep3}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  {isExecutingStep3 && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">Re-run</span>
                                  <span className="hidden md:inline">Re-run Step 3</span>
                                </Button>
                              )}
                              {/* Start Step 4 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step3StatusLower === 'completed' && step4StatusLower !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep4(product.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">Step 4</span>
                                  <span className="hidden md:inline">Run Step 4</span>
                                </Button>
                              )}
                              {/* Re-run Step 4 button */}
                              {!isStep2Running && !isStep3Running && !isStep4Running && step4StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartStep4(product.id)}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  <span className="md:hidden">Re-run</span>
                                  <span className="hidden md:inline">Re-run Step 4</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Requirements (Pro Feature) */}
                          <div className="bg-slate-200/80 border-0 p-2 md:p-4 h-full overflow-hidden opacity-80">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                  Requirements
                                </p>
                                <p className="text-sm md:text-2xl font-mono text-gray-300 truncate">
                                  -
                                </p>
                                <p className="hidden md:block text-xs text-gray-400 mt-1">available on Pro plan</p>
                              </div>
                              <div className="scale-75 origin-top-left md:scale-100 shrink-0">
                                <Badge className="bg-slate-100 text-slate-600 border-0">
                                  Pro
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = '/billing'}
                                  className="border-0 bg-slate-600 hover:bg-slate-700 text-white text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                <span className="md:hidden">Upgrade</span>
                                <span className="hidden md:inline">Upgrade to Pro</span>
                                </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Step 0 Results */}
                        {isStep0Expanded && loadingStepDetails.has(`${product.id}-step0`) && (
                          <div className="ml-0 md:ml-6 mt-2 p-8 bg-white flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--dashboard-link-color))]" />
                            <span className="ml-3 text-gray-500">Loading step details...</span>
                          </div>
                        )}
                        {isStep0Expanded && !loadingStepDetails.has(`${product.id}-step0`) && product.step0Results && (
                            <div className="ml-0 md:ml-6 mt-2 space-y-4">
                              {/* How to Improve Comprehensiveness - At Top */}
                              {editingStep0?.productId !== product.id && (product.step0Results?.quality_score !== undefined && product.step0Results.quality_score < 100) && (
                                <div className="bg-amber-50 border border-amber-200 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))] flex items-center gap-2">
                                      <Info className="w-4 h-4 text-amber-600" />
                                      How to Improve Comprehensiveness
                                    </h5>
                                    <Badge className={`font-mono font-bold border-0 ${
                                      product.step0Results.quality_score >= 70 ? 'bg-green-100 text-green-700' :
                                      product.step0Results.quality_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {product.step0Results.quality_score}% Complete
                                    </Badge>
                                  </div>
                                  
                                  {/* Component-specific missing information - use backend data if available */}
                                  {(() => {
                                    const components = product.components || [];
                                    const backendCompleteness = product.step0Results?.component_completeness || [];
                                    
                                    // PRIORITY 1: Use backend's component_completeness if available (AI-generated)
                                    if (backendCompleteness.length > 0) {
                                      // Filter to only show components that need improvement (< 70%)
                                      const incompleteComponents = backendCompleteness
                                        .filter((cc: any) => cc.completeness_percentage < 70)
                                        .sort((a: any, b: any) => a.completeness_percentage - b.completeness_percentage);
                                      
                                      if (incompleteComponents.length > 0) {
                                        return (
                                          <div className="space-y-3">
                                            {incompleteComponents.map((cc: any, idx: number) => (
                                              <div key={idx} className="bg-white p-3 border border-amber-100">
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                                    {cc.component_name}
                                                  </span>
                                                  <Badge className={`text-[10px] font-mono border-0 ${
                                                    cc.completeness_percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                    cc.completeness_percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                  }`}>
                                                    {cc.completeness_percentage}%
                                                  </Badge>
                                                </div>
                                                {cc.missing_details && (
                                                  <div className="space-y-1">
                                                    <p className="text-xs text-gray-600 mb-1">Missing:</p>
                                                    <p className="text-xs text-gray-700">{cc.missing_details}</p>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      } else {
                                        // All components from AI are >= 70%
                                        return (
                                          <p className="text-xs text-gray-600">Component details look good. Add more technical specifications to improve accuracy.</p>
                                        );
                                      }
                                    }
                                    
                                    // PRIORITY 2: Fallback - generate our own assessment from component data
                                    const missingByComponent: { name: string; missing: string[]; percentage: number }[] = [];
                                    
                                    // Helper to generate specific suggestions based on product type
                                    const getSpecificSuggestions = (compName: string, existingSpecs: string[]): string[] => {
                                      const suggestions: string[] = [];
                                      const nameLower = compName.toLowerCase();
                                      const existingLower = existingSpecs.map(s => s.toLowerCase());
                                      
                                      // Common specs needed for compliance
                                      const commonSpecs = [
                                        { key: 'weight', example: 'Weight (e.g., 450g, 1.2kg)' },
                                        { key: 'dimension', example: 'Dimensions (e.g., 26cm x 26cm x 2cm)' },
                                        { key: 'diameter', example: 'Diameter (e.g., 26cm)' },
                                        { key: 'height', example: 'Height (e.g., 2.5cm)' },
                                        { key: 'thickness', example: 'Thickness (e.g., 3mm)' },
                                        { key: 'volume', example: 'Volume/Capacity (e.g., 500ml)' },
                                        { key: 'color', example: 'Color (e.g., White, Glazed)' },
                                      ];
                                      
                                      // Product-specific suggestions
                                      if (nameLower.includes('plate') || nameLower.includes('dish') || nameLower.includes('bowl')) {
                                        if (!existingLower.some(s => s.includes('diameter'))) suggestions.push('Diameter (e.g., 26cm)');
                                        if (!existingLower.some(s => s.includes('depth') || s.includes('height'))) suggestions.push('Depth/Height (e.g., 2.5cm)');
                                        if (!existingLower.some(s => s.includes('weight'))) suggestions.push('Weight (e.g., 450g)');
                                        if (!existingLower.some(s => s.includes('food') || s.includes('safe'))) suggestions.push('Food-safe certification');
                                        if (!existingLower.some(s => s.includes('temperature') || s.includes('microwave') || s.includes('dishwasher'))) {
                                          suggestions.push('Temperature resistance / Microwave-safe / Dishwasher-safe');
                                        }
                                      } else if (nameLower.includes('cup') || nameLower.includes('mug') || nameLower.includes('glass')) {
                                        if (!existingLower.some(s => s.includes('capacity') || s.includes('volume'))) suggestions.push('Capacity (e.g., 350ml)');
                                        if (!existingLower.some(s => s.includes('height'))) suggestions.push('Height (e.g., 10cm)');
                                        if (!existingLower.some(s => s.includes('diameter'))) suggestions.push('Rim diameter (e.g., 8cm)');
                                      } else if (nameLower.includes('porcelain') || nameLower.includes('ceramic')) {
                                        if (!existingLower.some(s => s.includes('glaze'))) suggestions.push('Glaze type (e.g., Lead-free glaze)');
                                        if (!existingLower.some(s => s.includes('firing') || s.includes('temperature'))) suggestions.push('Firing temperature (e.g., 1280C)');
                                      }
                                      
                                      // Add common specs if still missing
                                      if (suggestions.length < 3) {
                                        commonSpecs.forEach(spec => {
                                          if (!existingLower.some(s => s.includes(spec.key)) && !suggestions.some(s => s.toLowerCase().includes(spec.key))) {
                                            suggestions.push(spec.example);
                                          }
                                        });
                                      }
                                      
                                      return suggestions.slice(0, 4); // Max 4 suggestions
                                    };
                                    
                                    components.forEach((comp: any) => {
                                      const missing: string[] = [];
                                      
                                      // Check materials
                                      const mats = Array.isArray(comp.materials) ? comp.materials : 
                                        typeof comp.materials === 'string' && comp.materials ? 
                                        comp.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
                                      const validMats = mats.filter((m: string) => m && m.toLowerCase() !== 'not specified');
                                      if (validMats.length === 0) {
                                        // Be specific about what materials to provide
                                        const nameLower = (comp.name || '').toLowerCase();
                                        if (nameLower.includes('porcelain') || nameLower.includes('ceramic')) {
                                          missing.push('Materials (e.g., Porcelain type, Glaze composition, Clay body)');
                                        } else if (nameLower.includes('metal') || nameLower.includes('steel')) {
                                          missing.push('Materials (e.g., Stainless Steel 304, Aluminum alloy grade)');
                                        } else if (nameLower.includes('plastic') || nameLower.includes('polymer')) {
                                          missing.push('Materials (e.g., PP, ABS, food-grade HDPE)');
                                        } else {
                                          missing.push('Materials (e.g., specific composition, grade, certifications)');
                                        }
                                      }
                                      
                                      // Check description
                                      if (!comp.description || comp.description.trim().length < 20) {
                                        missing.push('Detailed description (what it is, how it works, key features)');
                                      }
                                      
                                      // Check function
                                      if (!comp.function || comp.function.trim().length < 10) {
                                        missing.push('Component function/purpose (what role does it serve?)');
                                      }
                                      
                                      // Check technical specifications - be specific about what's missing
                                      const specs = comp.technical_specifications || {};
                                      const specKeys = Object.keys(specs);
                                      const validSpecs = specKeys.filter(k => {
                                        const val = String(specs[k] || '').toLowerCase();
                                        return val && val !== 'not specified' && val !== 'n/a' && val !== 'unknown' && val !== '';
                                      });
                                      
                                      // Need at least 3 valid specs for compliance - be SPECIFIC about which ones
                                      if (validSpecs.length < 3) {
                                        const specificSuggestions = getSpecificSuggestions(comp.name || '', validSpecs);
                                        if (specificSuggestions.length > 0) {
                                          specificSuggestions.forEach(suggestion => {
                                            missing.push(suggestion);
                                          });
                                        } else {
                                          missing.push('Weight (e.g., 450g)');
                                          missing.push('Dimensions (e.g., Length x Width x Height)');
                                        }
                                      }
                                      
                                      // Calculate percentage
                                      const totalFields = 4; // materials, description, function, specs
                                      const filledFields = totalFields - Math.min(missing.length, totalFields);
                                      const percentage = Math.round((filledFields / totalFields) * 100);
                                      
                                      // Add ALL components if overall score < 70%, otherwise only incomplete ones
                                      const qualityScore = product.step0Results?.quality_score ?? 0;
                                      if (qualityScore < 70 || missing.length > 0) {
                                        // If no missing items but score < 70%, add specific enhancement suggestions
                                        if (missing.length === 0) {
                                          const enhancementSuggestions = getSpecificSuggestions(comp.name || '', validSpecs);
                                          if (enhancementSuggestions.length > 0) {
                                            missing.push(...enhancementSuggestions.slice(0, 2));
                                          } else {
                                            missing.push('Add safety certifications (e.g., CE, FDA, food-contact safe)');
                                            missing.push('Add country of origin / Manufacturing details');
                                          }
                                        }
                                        
                                        missingByComponent.push({
                                          name: comp.name || 'Unnamed Component',
                                          missing: missing,
                                          percentage: percentage
                                        });
                                      }
                                    });
                                    
                                    // Sort by percentage (lowest first)
                                    missingByComponent.sort((a, b) => a.percentage - b.percentage);
                                    
                                    if (missingByComponent.length > 0) {
                                      return (
                                        <div className="space-y-3">
                                          {missingByComponent.map((comp, idx) => (
                                            <div key={idx} className="bg-white p-3 border border-amber-100">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                                  {comp.name}
                                                </span>
                                                <Badge className={`text-[10px] font-mono border-0 ${
                                                  comp.percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                  comp.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                                                }`}>
                                                  {comp.percentage}%
                                                </Badge>
                                              </div>
                                              <div className="space-y-1">
                                                {comp.missing.map((item, itemIdx) => (
                                                  <div key={itemIdx} className="flex items-start gap-2 text-xs text-gray-700">
                                                    <div className="w-4 h-4 border border-gray-300 bg-white shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    } else if (components.length === 0) {
                                      // No components at all
                                      return (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600 mb-2">No components found. Add product components with:</p>
                                          <div className="flex items-start gap-2 text-xs text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 bg-white shrink-0 mt-0.5" />
                                            <span>Component names and descriptions</span>
                                          </div>
                                          <div className="flex items-start gap-2 text-xs text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 bg-white shrink-0 mt-0.5" />
                                            <span>Materials used in each component</span>
                                          </div>
                                          <div className="flex items-start gap-2 text-xs text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 bg-white shrink-0 mt-0.5" />
                                            <span>Technical specifications (weight, dimensions)</span>
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      // All components look complete
                                      return (
                                        <p className="text-xs text-gray-600">Component details look good. Add more technical specifications to improve accuracy.</p>
                                      );
                                    }
                                  })()}
                                  
                                  <p className="text-[10px] text-amber-700 mt-3 pt-2 border-t border-amber-200">
                                    Use the Data Ingestion section below to add this information, then click "Save & Re-run Analysis"
                                  </p>
                                </div>
                              )}

                              {/* Data Ingestion Section */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-600" />
                                    <h5 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                      Data Ingestion
                                    </h5>
                                  </div>
                                  {dataIngestion?.productId !== product.id && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleStartDataIngestion(product.id)}
                                      className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs h-7"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Information
                                </Button>
                                  )}
                                </div>
                                
                                {dataIngestion?.productId === product.id ? (
                                  <div className="space-y-4">
                                    {/* Free Text Input */}
                                    <div>
                                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">
                                        <FileText className="w-3 h-3 inline mr-1" />
                                        Additional Product Information
                                      </Label>
                                      <textarea
                                        value={dataIngestion.freeText}
                                        onChange={(e) => setDataIngestion({ ...dataIngestion, freeText: e.target.value })}
                                        className="w-full text-xs text-gray-700 bg-white border border-gray-200 p-3 min-h-[100px]"
                                        placeholder="Enter any additional product details, specifications, technical data, certifications, or other relevant information that should be considered in the analysis..."
                                      />
                                    </div>
                                    
                                    {/* Source URLs */}
                                    <div>
                                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">
                                        <LinkIcon className="w-3 h-3 inline mr-1" />
                                        Reference Sources
                                      </Label>
                                      <div className="space-y-2">
                                        {dataIngestion.sourceUrls.map((url, idx) => (
                                          <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-gray-200">
                                            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                                            <a 
                                              href={url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:underline flex-1 truncate"
                                            >
                                              {url}
                                            </a>
                                            <button
                                              onClick={() => handleRemoveSourceUrl(idx)}
                                              className="text-red-500 hover:text-red-700 shrink-0"
                                            >
                                              <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                        <div className="flex gap-2">
                                          <Input
                                            type="url"
                                            value={dataIngestion.newSourceUrl}
                                            onChange={(e) => setDataIngestion({ ...dataIngestion, newSourceUrl: e.target.value })}
                                            placeholder="https://example.com/product-documentation"
                                            className="flex-1 text-xs border-gray-200 bg-white h-8"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSourceUrl();
                                              }
                                            }}
                                          />
                                  <Button
                                    size="sm"
                                            onClick={handleAddSourceUrl}
                                            disabled={!dataIngestion.newSourceUrl.trim()}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs h-8"
                                          >
                                            Add
                                  </Button>
                                </div>
                                      </div>
                                    </div>
                                    
                                    {/* Upload Documents */}
                                    <div>
                                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">
                                        <File className="w-3 h-3 inline mr-1" />
                                        Upload Documents
                                      </Label>
                                      <input
                                        ref={documentInputRef}
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                      />
                                      <div className="space-y-2">
                                        {dataIngestion.uploadedDocuments.map((doc, idx) => (
                                          <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-gray-200">
                                            <File className="w-3 h-3 text-blue-500 shrink-0" />
                                            <span className="text-xs text-gray-700 flex-1 truncate">{doc.name}</span>
                                            <span className="text-[10px] text-gray-400">{(doc.size / 1024).toFixed(1)} KB</span>
                                            <button
                                              onClick={() => handleRemoveDocument(idx)}
                                              className="text-red-500 hover:text-red-700 shrink-0"
                                            >
                                              <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                <Button
                                  size="sm"
                                          variant="outline"
                                          onClick={() => documentInputRef.current?.click()}
                                          className="w-full text-xs h-8 border-dashed border-gray-300 bg-white hover:bg-gray-50"
                                        >
                                          <Upload className="w-3 h-3 mr-1" />
                                          Upload PDF, Word, Excel, or Text files
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Upload Images */}
                                    <div>
                                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">
                                        <Image className="w-3 h-3 inline mr-1" />
                                        Upload Images
                                      </Label>
                                      <input
                                        ref={imageInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                      />
                                      <div className="space-y-2">
                                        {dataIngestion.uploadedImages.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {dataIngestion.uploadedImages.map((img, idx) => (
                                              <div key={idx} className="relative group">
                                                {img.preview ? (
                                                  <img
                                                    src={img.preview}
                                                    alt={img.name}
                                                    className="w-16 h-16 object-cover border border-gray-200"
                                                  />
                                                ) : (
                                                  <div className="w-16 h-16 bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                    <Image className="w-6 h-6 text-gray-400" />
                                                  </div>
                                                )}
                                                <button
                                                  onClick={() => handleRemoveImage(idx)}
                                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <XCircle className="w-3 h-3" />
                                                </button>
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] truncate px-1">
                                                  {img.name}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => imageInputRef.current?.click()}
                                          className="w-full text-xs h-8 border-dashed border-gray-300 bg-white hover:bg-gray-50"
                                        >
                                          <Image className="w-3 h-3 mr-1" />
                                          Upload product images
                                </Button>
                            </div>
                          </div>
                                    
                                    {/* Quick Capture Options */}
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // TODO: Implement camera capture
                                          console.log('Camera capture clicked');
                                        }}
                                        className="flex-1 text-xs h-8 border-dashed border-gray-300 bg-white hover:bg-gray-50"
                                      >
                                        <Camera className="w-3 h-3 mr-1" />
                                        Take Photo
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // TODO: Implement voice recording & transcription
                                          console.log('Voice note clicked');
                                        }}
                                        className="flex-1 text-xs h-8 border-dashed border-gray-300 bg-white hover:bg-gray-50"
                                      >
                                        <Mic className="w-3 h-3 mr-1" />
                                        Voice Note
                                      </Button>
                        </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelDataIngestion}
                                        disabled={savingDataIngestion}
                                        className="text-xs h-7 border-gray-300"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleSaveDataIngestion}
                                        disabled={savingDataIngestion}
                                        className="bg-gray-600 hover:bg-gray-700 text-white text-xs h-7"
                                      >
                                        {savingDataIngestion ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : null}
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleSaveAndRerunWithDataIngestion}
                                        disabled={savingDataIngestion}
                                        className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs h-7"
                                      >
                                        {savingDataIngestion ? (
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                          <Play className="w-3 h-3 mr-1" />
                                        )}
                                        Save & Re-run Analysis
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    {/* Display existing data ingestion if any - but NOT while step0 is running (it's being processed) */}
                                    {product.step0Status !== 'running' && (
                                     (product as any).dataIngestion?.freeText || 
                                     (product as any).dataIngestion?.sourceUrls?.length > 0 ||
                                     (product as any).dataIngestion?.uploadedDocuments?.length > 0 ||
                                     (product as any).dataIngestion?.uploadedImages?.length > 0) ? (
                                      <div className="space-y-3">
                                        {(product as any).dataIngestion?.freeText && (
                                          <div>
                                            <p className="text-xs text-gray-500 mb-1">Additional Information:</p>
                                            <p className="text-xs text-gray-700 bg-white p-2 border border-gray-100 whitespace-pre-wrap">
                                              {(product as any).dataIngestion.freeText.length > 200 
                                                ? (product as any).dataIngestion.freeText.substring(0, 200) + '...' 
                                                : (product as any).dataIngestion.freeText}
                                            </p>
                          </div>
                        )}
                                        {(product as any).dataIngestion?.sourceUrls?.length > 0 && (
                                          <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                              <LinkIcon className="w-3 h-3 inline mr-1" />
                                              Reference Sources: {(product as any).dataIngestion.sourceUrls.length}
                                            </p>
                                          </div>
                                        )}
                                        {(product as any).dataIngestion?.uploadedDocuments?.length > 0 && (
                                          <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                              <File className="w-3 h-3 inline mr-1" />
                                              Documents: {(product as any).dataIngestion.uploadedDocuments.length} file(s)
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {(product as any).dataIngestion.uploadedDocuments.slice(0, 3).map((doc: any, idx: number) => (
                                                <Badge key={idx} className="bg-blue-50 text-blue-700 border-0 text-[10px]">
                                                  {doc.name}
                                                </Badge>
                                              ))}
                                              {(product as any).dataIngestion.uploadedDocuments.length > 3 && (
                                                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                                                  +{(product as any).dataIngestion.uploadedDocuments.length - 3} more
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {(product as any).dataIngestion?.uploadedImages?.length > 0 && (
                                          <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                              <Image className="w-3 h-3 inline mr-1" />
                                              Images: {(product as any).dataIngestion.uploadedImages.length} image(s)
                                            </p>
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStartDataIngestion(product.id)}
                                          className="text-xs h-6 border-gray-300"
                                        >
                                          <Edit className="w-3 h-3 mr-1" />
                                          Edit
                                        </Button>
                                      </div>
                                    ) : product.step0Status === 'running' ? (
                                      <div className="flex items-center gap-2 text-xs text-blue-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing ingested data and updating product data...</span>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 italic">
                                        Add additional product information, upload documents/images, or add reference links to enhance the analysis.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Edit Controls - Fixed at top right */}
                              <div className="flex justify-end mb-2">
                                {editingStep0?.productId === product.id ? (
                                  <div className="flex gap-2">
                                    <Button
                                  onClick={(e) => {
                                        e.preventDefault();
                                    e.stopPropagation();
                                        handleSaveStep0(product.id);
                                  }}
                                      size="sm"
                                      disabled={savingStep0}
                                      className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs px-3 py-1.5 h-7"
                                >
                                      {savingStep0 ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save'
                                      )}
                                </Button>
                                <Button
                                  onClick={(e) => {
                                        e.preventDefault();
                                    e.stopPropagation();
                                        handleCancelEditStep0();
                                  }}
                                      size="sm"
                                      variant="outline"
                                      disabled={savingStep0}
                                      className="text-xs px-3 py-1.5 h-7"
                                >
                                      Cancel
                                </Button>
                              </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🖊️ Edit button clicked for product:', product.id);
                                      console.log('Current editingStep0 state:', editingStep0);
                                      console.log('Products array length:', products.length);
                                      handleStartEditStep0(product.id);
                                    }}
                                    className="px-3 py-1.5 h-7 hover:bg-gray-100 rounded border border-gray-300 cursor-pointer bg-white shadow-sm flex items-center justify-center gap-1.5 text-xs font-medium text-[hsl(var(--dashboard-link-color))]"
                                    title="Edit Step 0"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>Edit</span>
                          </button>
                                )}
                        </div>
                          
                              {/* Categories and Materials at the TOP */}
                              <div className="space-y-3">
                                {/* Categories - First */}
                                {((editingStep0?.productId === product.id) || 
                                  (editingStep0?.productId !== product.id && product.step0Results.categories && product.step0Results.categories.length > 0)) && (
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="text-xs font-semibold text-gray-600">Categories</h6>
                                      {editingStep0?.productId === product.id && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={handleAddCategory}
                                            className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0"
                                            title="Add category"
                                          >
                                            + Add
                                          </button>
                                          {(step0EditData?.categories?.length > 0) && (
                                            <button
                                              onClick={() => handleRemoveStep0Section('category')}
                                              className="text-red-500 hover:text-red-700"
                                              title="Remove all categories"
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {(editingStep0?.productId === product.id ? step0EditData?.categories : product.step0Results.categories)?.map((category: string, idx: number) => (
                                        editingStep0?.productId === product.id ? (
                                          <input
                                            key={idx}
                                            type="text"
                                            value={category}
                                            onChange={(e) => handleUpdateCategory(idx, e.target.value)}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded min-w-[100px]"
                                            placeholder="Category name"
                                          />
                                        ) : (
                                        <Badge 
                                          key={idx} 
                                          className="bg-blue-100 text-blue-700 border-0 flex items-center gap-1 pr-1"
                                        >
                                          {category}
                                          <button
                                            onClick={() => handleRemoveCategory(product.id, category)}
                                            className="ml-1 hover:bg-blue-200 p-0.5"
                                            title="Remove category"
                                          >
                                            ✕
                                          </button>
                                        </Badge>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Materials - Second */}
                                {((editingStep0?.productId === product.id) || 
                                  (editingStep0?.productId !== product.id && product.step0Results.materials && product.step0Results.materials.length > 0)) && (
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="text-xs font-semibold text-gray-600">Materials</h6>
                                      {editingStep0?.productId === product.id && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={handleAddMaterial}
                                            className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0"
                                            title="Add material"
                                          >
                                            + Add
                                          </button>
                                          {(step0EditData?.materials?.length > 0) && (
                                            <button
                                              onClick={() => handleRemoveStep0Section('material')}
                                              className="text-red-500 hover:text-red-700"
                                              title="Remove all materials"
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {(editingStep0?.productId === product.id ? step0EditData?.materials : product.step0Results.materials)?.map((material: string, idx: number) => (
                                        editingStep0?.productId === product.id ? (
                                          <input
                                            key={idx}
                                            type="text"
                                            value={material}
                                            onChange={(e) => handleUpdateMaterial(idx, e.target.value)}
                                            className="text-xs px-2 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded min-w-[100px]"
                                            placeholder="Material name"
                                          />
                                        ) : (
                                        <Badge 
                                          key={idx} 
                                          className="bg-slate-100 text-slate-700 border-0 flex items-center gap-1 pr-1"
                                        >
                                          {material}
                                          <button
                                            onClick={() => handleRemoveMaterial(product.id, material)}
                                            className="ml-1 hover:bg-slate-200 p-0.5"
                                            title="Remove material"
                                          >
                                            ✕
                                          </button>
                                        </Badge>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Product Overview */}
                              {((editingStep0?.productId === product.id) || 
                                (editingStep0?.productId !== product.id && (product.step0Results.product_overview || product.description))) && (
                                <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                  Product Overview
                                </h5>
                                  {editingStep0?.productId === product.id && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveStep0Section('overview');
                                      }}
                                      className="text-red-500 hover:text-red-700 z-10"
                                      title="Remove Product Overview"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="bg-dashboard-view-background p-4">
                                    {editingStep0?.productId === product.id ? (
                                      <textarea
                                        value={step0EditData?.product_overview || ''}
                                        onChange={(e) => setStep0EditData({ ...step0EditData, product_overview: e.target.value })}
                                        className="w-full text-xs text-gray-700 bg-white border border-gray-300 p-2 min-h-[100px]"
                                        placeholder="Product overview..."
                                      />
                                    ) : (
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {product.step0Results.product_overview || product.description}
                                  </p>
                                    )}
                                </div>
                              </div>
                              )}

                              {/* Components */}
                              {((editingStep0?.productId === product.id) || 
                                (editingStep0?.productId !== product.id && product.components && product.components.length > 0)) && (
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                      Components ({(editingStep0?.productId === product.id ? step0EditData?.components : product.components)?.length || 0})
                                  </h5>
                                    <div className="flex items-center gap-2">
                                      {/* Expand/Collapse All buttons - only show in view mode and when > 1 component */}
                                      {editingStep0?.productId !== product.id && product.components && product.components.length > 1 && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => toggleAllComponents(product.id, product.components || [], true)}
                                            className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 hover:bg-gray-200 border-0"
                                            title="Expand all components"
                                          >
                                            Expand All
                                          </button>
                                          <button
                                            onClick={() => toggleAllComponents(product.id, product.components || [], false)}
                                            className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 hover:bg-gray-200 border-0"
                                            title="Collapse all components"
                                          >
                                            Collapse All
                                          </button>
                                        </div>
                                      )}
                                    {editingStep0?.productId === product.id && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            const newComponent = {
                                              name: `Component ${(step0EditData?.components?.length || 0) + 1}`,
                                              description: '',
                                              materials: '',
                                              function: '',
                                              technical_specifications: {}
                                            };
                                            setStep0EditData({
                                              ...step0EditData,
                                              components: [...(step0EditData?.components || []), newComponent]
                                            });
                                          }}
                                          className="text-xs px-2 py-0.5 bg-[hsl(var(--dashboard-link-color))] text-white hover:bg-[hsl(var(--dashboard-link-color))]/80 border-0"
                                          title="Add component"
                                        >
                                          + Add Component
                                        </button>
                                        {(step0EditData?.components?.length > 0) && (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setStep0EditData({ ...step0EditData, components: [] });
                                            }}
                                            className="text-red-500 hover:text-red-700 z-10"
                                            title="Remove all components"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  </div>
                                  <div className="space-y-2">
                                    {(editingStep0?.productId === product.id ? step0EditData?.components : product.components)?.map((component: any, idx: number) => {
                                      const isExpanded = editingStep0?.productId === product.id || (expandedComponents.get(product.id)?.has(idx) ?? false);
                                      
                                      return (
                                      <div key={idx} className="bg-white border border-gray-100 relative">
                                        {/* Collapsible Header - always visible in view mode for THIS product */}
                                        {editingStep0?.productId !== product.id && (
                                          <button
                                            onClick={() => toggleComponentExpansion(product.id, idx)}
                                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex items-center gap-2">
                                              {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                              ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                              )}
                                              <span className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                                {component.name || `Component ${idx + 1}`}
                                              </span>
                                              {/* Brief preview when collapsed */}
                                              {!isExpanded && component.description && (
                                                <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                                  - {component.description.slice(0, 50)}{component.description.length > 50 ? '...' : ''}
                                                </span>
                                              )}
                                            </div>
                                            {/* Completeness badge in header */}
                                            {(() => {
                                              const cc = product.step0Results?.component_completeness?.find(
                                                (c: any) => c.component_name === component.name
                                              );
                                              if (!cc || cc.completeness_percentage === undefined) return null;
                                              return (
                                                <Badge className={`text-[10px] font-mono font-bold border-0 ${
                                                  cc.completeness_percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                  cc.completeness_percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                                                }`}>
                                                  {cc.completeness_percentage}%
                                                </Badge>
                                              );
                                            })()}
                                          </button>
                                        )}
                                        
                                        {/* Edit mode - always show delete button */}
                                        {editingStep0?.productId === product.id && (
                                          <button
                                            onClick={() => handleRemoveStep0Section('component', idx)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                                            title="Remove component"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                        
                                        {/* Expandable Content */}
                                        {isExpanded && (
                                          <div className={editingStep0?.productId === product.id ? 'p-4' : 'px-4 pb-4'}>
                                        
                                        {editingStep0?.productId === product.id ? (
                                          <div className="space-y-3">
                                            <div>
                                              <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-semibold text-gray-600">Component Name</label>
                                                {product.step0Results?.component_completeness?.find(
                                                  (cc: any) => cc.component_name === component.name
                                                )?.completeness_percentage !== undefined && (() => {
                                                  const cc = product.step0Results!.component_completeness!.find((c: any) => c.component_name === component.name)!;
                                                  return (
                                                    <div className="flex items-center gap-1">
                                                      <Badge className={`text-xs font-mono font-bold border-0 ${
                                                        cc.completeness_percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                        cc.completeness_percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                      }`}>
                                                        {cc.completeness_percentage}%
                                                      </Badge>
                                                      {cc.completeness_percentage < 70 && cc.missing_details && (
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setComponentInfoModal({
                                                              open: true,
                                                              componentName: component.name,
                                                              percentage: cc.completeness_percentage,
                                                              missingDetails: cc.missing_details
                                                            });
                                                          }}
                                                          className="text-gray-400 hover:text-gray-600"
                                                          title="How to improve"
                                                        >
                                                          <Info className="w-3.5 h-3.5" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                              <input
                                                type="text"
                                                value={component.name || ''}
                                                onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                                                className="w-full text-xs px-2 py-1 bg-white border border-gray-300"
                                                placeholder="Component name"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                                              <textarea
                                                value={component.description || ''}
                                                onChange={(e) => handleUpdateComponent(idx, 'description', e.target.value)}
                                                className="w-full text-xs px-2 py-1 bg-white border border-gray-300 min-h-[60px]"
                                                placeholder="Component description"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="text-xs font-semibold text-gray-600 block mb-1">Materials</label>
                                              <div className="bg-white border border-gray-300 p-2 space-y-2">
                                                <div className="flex flex-wrap gap-2">
                                                  {(Array.isArray(component.materials) ? component.materials : 
                                                    typeof component.materials === 'string' && component.materials ? 
                                                    component.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : 
                                                    []
                                                  ).map((material: string, matIdx: number) => (
                                                    <div key={matIdx} className="flex items-center gap-1 bg-gray-100 px-2 py-1">
                                                      <input
                                                        type="text"
                                                        value={material}
                                                        onChange={(e) => {
                                                          const materials = Array.isArray(component.materials) ? [...component.materials] : 
                                                            typeof component.materials === 'string' && component.materials ? 
                                                            component.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
                                                          materials[matIdx] = e.target.value;
                                                          handleUpdateComponent(idx, 'materials', materials);
                                                        }}
                                                        className="text-xs px-1 py-0.5 bg-white border-0 w-24"
                                                        placeholder="Material"
                                                      />
                                                      <button
                                                        onClick={() => {
                                                          const materials = Array.isArray(component.materials) ? [...component.materials] : 
                                                            typeof component.materials === 'string' && component.materials ? 
                                                            component.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
                                                          materials.splice(matIdx, 1);
                                                          handleUpdateComponent(idx, 'materials', materials);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                        title="Remove material"
                                                      >
                                                        ✕
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    const materials = Array.isArray(component.materials) ? [...component.materials] : 
                                                      typeof component.materials === 'string' && component.materials ? 
                                                      component.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
                                                    materials.push('');
                                                    handleUpdateComponent(idx, 'materials', materials);
                                                  }}
                                                  className="text-xs text-gray-500 hover:text-gray-700"
                                                >
                                                  + Add Material
                                                </button>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <label className="text-xs font-semibold text-gray-600 block mb-1">Function</label>
                                              <textarea
                                                value={component.function || ''}
                                                onChange={(e) => handleUpdateComponent(idx, 'function', e.target.value)}
                                                className="w-full text-xs px-2 py-1 bg-white border border-gray-300 min-h-[50px]"
                                                placeholder="Component function"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="text-xs font-semibold text-gray-600 block mb-1">Technical Specifications</label>
                                              <div className="bg-white border border-gray-300 p-2 space-y-2">
                                                {Object.entries(component.technical_specifications || {}).map(([key, value]: [string, any], specIdx: number) => (
                                                  <div key={specIdx} className="flex gap-2">
                                                    <input
                                                      type="text"
                                                      value={key}
                                                      onChange={(e) => {
                                                        const specs = { ...component.technical_specifications || {} };
                                                        delete specs[key];
                                                        specs[e.target.value] = value;
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="flex-1 text-xs px-2 py-1 bg-white border border-gray-200"
                                                      placeholder="Spec name"
                                                    />
                                                    <input
                                                      type="text"
                                                      value={String(value)}
                                                      onChange={(e) => {
                                                        const specs = { ...component.technical_specifications || {} };
                                                        specs[key] = e.target.value;
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="flex-1 text-xs px-2 py-1 bg-white border border-gray-200"
                                                      placeholder="Spec value"
                                                    />
                                                    <button
                                                      onClick={() => {
                                                        const specs = { ...component.technical_specifications || {} };
                                                        delete specs[key];
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="text-red-500 hover:text-red-700 px-1"
                                                      title="Remove spec"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                                <button
                                                  onClick={() => {
                                                    const specs = { ...component.technical_specifications || {} };
                                                    specs['New Spec'] = '';
                                                    handleUpdateComponent(idx, 'technical_specifications', specs);
                                                  }}
                                                  className="text-xs text-gray-500 hover:text-gray-700"
                                                >
                                                  + Add Spec
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                        <div className="flex items-center justify-between mb-2">
                                          <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                            {component.name || `Component ${idx + 1}`}
                                          </h6>
                                          {product.step0Results?.component_completeness?.find(
                                            (cc: any) => cc.component_name === component.name
                                          )?.completeness_percentage !== undefined && (() => {
                                            const cc = product.step0Results!.component_completeness!.find((c: any) => c.component_name === component.name)!;
                                            return (
                                              <div className="flex items-center gap-1">
                                                <Badge className={`text-xs font-mono font-bold border-0 ${
                                                  cc.completeness_percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                  cc.completeness_percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                                                }`}>
                                                  {cc.completeness_percentage}%
                                                </Badge>
                                                {cc.completeness_percentage < 70 && cc.missing_details && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setComponentInfoModal({
                                                        open: true,
                                                        componentName: component.name,
                                                        percentage: cc.completeness_percentage,
                                                        missingDetails: cc.missing_details
                                                      });
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="How to improve"
                                                  >
                                                    <Info className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        
                                        {/* Description */}
                                        {component.description && (
                                          <div className="mb-3">
                                            <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                              {component.description}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Materials */}
                                          <div className="mb-3">
                                            <div className="text-xs font-semibold text-gray-600 mb-1">Materials</div>
                                            <div className="flex flex-wrap gap-1.5">
                                            {(() => {
                                              const mats = Array.isArray(component.materials) ? component.materials : 
                                                typeof component.materials === 'string' && component.materials ? 
                                                component.materials.split(',').map((m: string) => m.trim()).filter(Boolean) : 
                                                [];
                                              // Filter out "Not specified" placeholder
                                              const validMats = mats.filter((m: string) => m && m.toLowerCase() !== 'not specified');
                                              if (validMats.length === 0) {
                                                return (
                                                  <span className="text-xs text-gray-400 italic">No materials specified</span>
                                                );
                                              }
                                              return validMats.map((material: string, matIdx: number) => (
                                                <Badge 
                                                  key={matIdx} 
                                                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 text-xs px-2 py-0.5"
                                                >
                                                  {material}
                                                </Badge>
                                              ));
                                            })()}
                                            </div>
                                          </div>
                                        
                                        {/* Function */}
                                        {component.function && (
                                          <div className="mb-3">
                                            <span className="text-xs font-semibold text-gray-600">Function: </span>
                                            <span className="text-xs text-gray-700">{component.function}</span>
                                          </div>
                                            )}
                                          </>
                                        )}
                                        
                                        {/* Technical Specifications Table */}
                                        {(component.technical_specifications || (editingStep0?.productId === product.id)) && (
                                          <div className="mt-3">
                                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Technical Specifications</h6>
                                            {editingStep0?.productId === product.id ? (
                                              <div className="bg-white border border-gray-300 p-2 space-y-2">
                                                {Object.entries(component.technical_specifications || {}).map(([key, value]: [string, any], specIdx: number) => (
                                                  <div key={specIdx} className="flex gap-2">
                                                    <input
                                                      type="text"
                                                      value={key}
                                                      onChange={(e) => {
                                                        const specs = { ...component.technical_specifications };
                                                        delete specs[key];
                                                        specs[e.target.value] = value;
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="flex-1 text-xs px-2 py-1 bg-white border border-gray-200"
                                                      placeholder="Spec name"
                                                    />
                                                    <input
                                                      type="text"
                                                      value={String(value)}
                                                      onChange={(e) => {
                                                        const specs = { ...component.technical_specifications };
                                                        specs[key] = e.target.value;
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="flex-1 text-xs px-2 py-1 bg-white border border-gray-200"
                                                      placeholder="Spec value"
                                                    />
                                                    <button
                                                      onClick={() => {
                                                        const specs = { ...component.technical_specifications };
                                                        delete specs[key];
                                                        handleUpdateComponent(idx, 'technical_specifications', specs);
                                                      }}
                                                      className="text-red-500 hover:text-red-700 px-1"
                                                      title="Remove spec"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                                <button
                                                  onClick={() => {
                                                    const specs = { ...component.technical_specifications || {} };
                                                    specs['New Spec'] = '';
                                                    handleUpdateComponent(idx, 'technical_specifications', specs);
                                                  }}
                                                  className="text-xs text-gray-500 hover:text-gray-700"
                                                >
                                                  + Add Spec
                                                </button>
                                              </div>
                                            ) : (
                                            <div className="bg-white border-0 overflow-x-auto">
                                              <table className="w-full text-xs">
                                                <tbody>
                                                    {Object.entries(component.technical_specifications || {}).map(([key, value], specIdx) => (
                                                    <tr key={specIdx} className="border-b border-gray-200 last:border-0">
                                                      <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 w-1/3">
                                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                      </td>
                                                      <td className="py-2 px-3 text-gray-700">
                                                        {String(value)}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Related Compliance Elements (from Step 2) */}
                                        {product.step2Results?.component_element_map && component.name && (
                                          (() => {
                                            const relatedElements = product.step2Results.component_element_map[component.name] || [];
                                            if (relatedElements.length === 0) return null;
                                            
                                            return (
                                              <div className="mt-3 pt-3 border-t border-gray-100">
                                                <h6 className="text-xs font-semibold text-gray-600 mb-2">
                                                  Related Compliance Elements ({relatedElements.length})
                                                </h6>
                                                <div className="flex flex-wrap gap-1">
                                                  {relatedElements.map((elName: string, elIdx: number) => (
                                                    <Badge 
                                                      key={elIdx} 
                                                      className="bg-purple-50 text-purple-700 text-[10px] border-0 px-2 py-0.5"
                                                      title={elName}
                                                    >
                                                      {elName.length > 30 ? elName.substring(0, 30) + '...' : elName}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })()
                                        )}
                                </div>
                              )}
                                      </div>
                                    );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Research Sources */}
                              {((editingStep0?.productId === product.id) || 
                                (editingStep0?.productId !== product.id && product.step0Payload?.research_sources && product.step0Payload.research_sources.length > 0)) && (
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                      Research Sources ({editingStep0?.productId === product.id ? (step0EditData?.research_sources?.length || 0) : (product.step0Payload?.research_sources?.length || 0)})
                                  </h5>
                                    {editingStep0?.productId === product.id && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRemoveStep0Section('sources');
                                        }}
                                        className="text-red-500 hover:text-red-700 z-10"
                                        title="Remove All Research Sources"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="bg-dashboard-view-background p-4 space-y-2">
                                    {editingStep0?.productId === product.id ? (
                                      <>
                                        {/* List of sources with remove buttons */}
                                        {step0EditData?.research_sources && step0EditData.research_sources.length > 0 ? (
                                          <div className="space-y-2 mb-4">
                                            {step0EditData.research_sources.map((source: any, idx: number) => (
                                              <div key={idx} className="flex items-start gap-2 bg-white p-2 border-0">
                                                <span className="text-xs text-gray-500 mt-0.5">{idx + 1}.</span>
                                                <a 
                                                  href={source.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-[hsl(var(--dashboard-link-color))] hover:underline flex-1 break-all"
                                                >
                                                  {source.url}
                                                </a>
                                                <button
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const newSources = [...(step0EditData.research_sources || [])];
                                                    newSources.splice(idx, 1);
                                                    setStep0EditData({ ...step0EditData, research_sources: newSources });
                                                  }}
                                                  className="text-red-500 hover:text-red-700 shrink-0"
                                                  title="Remove this source"
                                                >
                                                  <XCircle className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-500 mb-4">No sources yet. Add sources below.</p>
                                        )}
                                        
                                        {/* Add new source input */}
                                        <div className="flex gap-2">
                                          <Input
                                            type="url"
                                            placeholder="https://example.com/product-info"
                                            className="flex-1 text-xs border-0 bg-white"
                                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                const url = input.value.trim();
                                                if (url) {
                                                  const newSources = [...(step0EditData?.research_sources || []), { url, content: '' }];
                                                  setStep0EditData({ ...step0EditData, research_sources: newSources });
                                                  input.value = '';
                                                }
                                              }
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                              e.preventDefault();
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              const url = input?.value.trim();
                                              if (url) {
                                                const newSources = [...(step0EditData?.research_sources || []), { url, content: '' }];
                                                setStep0EditData({ ...step0EditData, research_sources: newSources });
                                                input.value = '';
                                              }
                                            }}
                                            className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        {/* Display mode - show list of sources */}
                                        {product.step0Payload?.research_sources && product.step0Payload.research_sources.length > 0 ? (
                                          <div className="space-y-2">
                                            {product.step0Payload.research_sources.map((source: any, idx: number) => (
                                              <div key={idx} className="flex items-start gap-2">
                                                <span className="text-xs text-gray-500 mt-0.5">{idx + 1}.</span>
                                                <a 
                                                  href={source.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-[hsl(var(--dashboard-link-color))] hover:underline break-all"
                                                >
                                                  {source.url}
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-600">
                                            {product.step0Results?.research_sources || 0} sources used during analysis.
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Fallback: Show raw text if no components */}
                              {/* Always show full product decomposition if available */}
                              {((editingStep0?.productId === product.id) || 
                                (editingStep0?.productId !== product.id && product.step0Results?.product_decomposition)) && (
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                    Complete Technical Product Decomposition
                                  </h5>
                                    {editingStep0?.productId === product.id && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRemoveStep0Section('decomposition');
                                        }}
                                        className="text-red-500 hover:text-red-700 z-10"
                                        title="Remove Product Decomposition"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="bg-dashboard-view-background p-4 max-h-[600px] overflow-y-auto">
                                    {editingStep0?.productId === product.id ? (
                                      <textarea
                                        value={step0EditData?.product_decomposition || ''}
                                        onChange={(e) => setStep0EditData({ ...step0EditData, product_decomposition: e.target.value })}
                                        className="w-full text-xs text-gray-700 bg-white border border-gray-300 p-2 min-h-[200px] font-mono"
                                        placeholder="Product decomposition..."
                                      />
                                    ) : (
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                        {product.step0Results?.product_decomposition}
                                    </pre>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Expandable Step 2 Results */}
                        {isStep2Expanded && loadingStepDetails.has(`${product.id}-step2`) && (
                          <div className="ml-0 md:ml-6 mt-2 p-8 bg-white flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--dashboard-link-color))]" />
                            <span className="ml-3 text-gray-500">Loading compliance elements...</span>
                          </div>
                        )}
                        {isStep2Expanded && !loadingStepDetails.has(`${product.id}-step2`) && product.step2Results && (
                            <div className="ml-0 md:ml-6 mt-2 relative">
                              {/* Edit Icon - Top Right */}
                              <div className="absolute top-0 right-0">
                                {editingStep2?.productId === product.id ? (
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('💾 Save button clicked for product:', product.id);
                                        handleSaveStep2(product.id);
                                      }}
                                      size="sm"
                                      className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs px-3 py-1.5 h-7"
                                      type="button"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditStep2}
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-2 py-1 h-6"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handleStartEditStep2(product.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs px-2 py-1 h-6"
                                    title="Edit Step 2"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Elements ({(editingStep2?.productId === product.id ? step2EditData?.compliance_elements?.length : product.step2Results.elements_count) || 0})
                                </h5>
                              </div>
                              
                              {/* Edit Mode: Search and Manual Input */}
                              {editingStep2?.productId === product.id && (
                                <div className="mb-4 space-y-3 p-3 bg-dashboard-view-background">
                                  {/* Search Field */}
                                  <div className="relative">
                                    <Label className="text-xs font-medium text-[hsl(var(--dashboard-link-color))] mb-1 block">
                                      Search Compliance Elements
                                    </Label>
                                    <input
                                      type="text"
                                      value={searchQuery}
                                      onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearchComplianceElements(e.target.value);
                                      }}
                                      onFocus={() => {
                                        if (searchQuery.length >= 2) {
                                          setShowSearchResults(true);
                                        }
                                      }}
                                      className="w-full text-xs border border-gray-300 p-2 bg-white"
                                      placeholder="Type to search..."
                                    />
                                    {showSearchResults && searchResults.length > 0 && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 max-h-48 overflow-y-auto">
                                        {searchResults.map((element, idx) => (
                                          <div
                                            key={idx}
                                            onClick={() => handleSelectComplianceElement(element)}
                                            className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-0"
                                          >
                                            <div className="text-xs font-semibold text-[hsl(var(--dashboard-link-color))]">
                                              {element.name}
                                            </div>
                                            {element.designation && (
                                              <div className="text-xs text-gray-500">
                                                {element.designation}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Manual Input Field */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-[hsl(var(--dashboard-link-color))] mb-1 block">
                                      Add Compliance Element (name or designation)
                                    </Label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={manualElementInput}
                                        onChange={(e) => setManualElementInput(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleAddManualElement();
                                          }
                                        }}
                                        className="flex-1 text-xs border border-gray-300 p-2 bg-white"
                                        placeholder="Enter name or designation..."
                                      />
                                      <Button
                                        onClick={handleAddManualElement}
                                        size="sm"
                                        className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs px-3"
                                        disabled={!manualElementInput.trim()}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                    
                                    {/* Market Selection */}
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                          Market
                                        </Label>
                                        <select
                                          value={manualElementMarket}
                                          onChange={(e) => setManualElementMarket(e.target.value)}
                                          className="w-full text-xs border border-gray-300 p-2 bg-white"
                                        >
                                          <option value="">Select market (optional)</option>
                                          {product.markets?.map((market: string) => (
                                            <option key={market} value={market}>
                                              {market}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      {/* Type Selection */}
                                      <div className="flex-1">
                                        <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                          Type
                                        </Label>
                                        <select
                                          value={manualElementType}
                                          onChange={(e) => setManualElementType(e.target.value)}
                                          className="w-full text-xs border border-gray-300 p-2 bg-white"
                                        >
                                          <option value="legislation">Legislation</option>
                                          <option value="standard">Standard</option>
                                          <option value="marking">Marking</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Category Filter */}
                              {complianceAreas.length > 0 && (
                                <div className="mb-4 p-3 bg-dashboard-view-background">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-medium text-[hsl(var(--dashboard-link-color))]">
                                      Filter by Compliance Area:
                                    </Label>
                                    {selectedCategories.size > 0 && (
                                      <button
                                        onClick={clearFilters}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                      >
                                        Clear filters
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {complianceAreas.map((area) => {
                                      const isSelected = selectedCategories.has(area.id);
                                      return (
                                        <button
                                          key={area.id}
                                          onClick={() => toggleCategory(area.id)}
                                          className={`px-3 py-1 text-xs border-0 transition-colors ${
                                            isSelected
                                              ? 'bg-[hsl(var(--dashboard-link-color))] text-white'
                                              : 'bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100'
                                          }`}
                                        >
                                          {area.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Display as structured list if we have parsed elements */}
                              {((editingStep2?.productId === product.id && step2EditData?.compliance_elements?.length > 0) || 
                                (!editingStep2 && product.step2Results.compliance_elements && Array.isArray(product.step2Results.compliance_elements) && product.step2Results.compliance_elements.length > 0)) ? (
                                (() => {
                                  // Use edit data if in edit mode, otherwise use product data
                                  const elementsToDisplay = editingStep2?.productId === product.id 
                                    ? step2EditData?.compliance_elements 
                                    : product.step2Results.compliance_elements;
                                  
                                  // Filter elements by selected categories
                                  let filteredElements = elementsToDisplay;
                                  
                                  if (selectedCategories.size > 0) {
                                    filteredElements = filteredElements.filter((element: any) => {
                                      const areaIds = element?.compliance_area_id || element?.compliance_area_custom_ids || [];
                                      return areaIds.some((id: string) => selectedCategories.has(id));
                                    });
                                  }

                                  // Group elements by normalized type
                                  const grouped = filteredElements.reduce((acc: any, element: any) => {
                                    const rawType = (element?.element_type || element?.type || 'other').toLowerCase();
                                    let category = 'legislation';
                                    
                                    // Normalize type to one of three categories
                                    if (rawType.includes('standard') || rawType === 'standard') {
                                      category = 'standard';
                                    } else if (rawType.includes('marking') || rawType === 'marking') {
                                      category = 'marking';
                                    } else if (rawType.includes('regulation') || rawType.includes('directive') || rawType.includes('framework') || rawType.includes('law') || rawType === 'regulation' || rawType === 'directive') {
                                      category = 'legislation';
                                    }
                                    
                                    if (!acc[category]) acc[category] = [];
                                    acc[category].push(element);
                                    return acc;
                                  }, {});

                                  // Toggle group expansion
                                  const toggleElementGroup = (groupKey: string) => {
                                    setExpandedElementGroups(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(groupKey)) {
                                        newSet.delete(groupKey);
                                      } else {
                                        newSet.add(groupKey);
                                      }
                                      return newSet;
                                    });
                                  };

                                  const renderElementGroup = (category: string, title: string) => {
                                    const elements = grouped[category] || [];
                                    const isExpanded = expandedElementGroups.has(category);
                                    
                                    return (
                                      <div key={category} className="mb-4">
                                        {/* Collapsible Header */}
                                        <button
                                          onClick={() => toggleElementGroup(category)}
                                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            {isExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-500" />
                                            )}
                                        <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                        <h6 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                          {title}
                                      </h6>
                                            <span className="text-xs text-gray-400">({elements.length})</span>
                                      </div>
                                        </button>
                                        
                                        {/* Collapsible Content */}
                                        {isExpanded && elements.length > 0 && (
                                          <div className="border-l-2 border-slate-200 ml-2">
                                            {elements.map((element: any, idx: number) => {
                                          const name = element?.element_name || element?.name || 'Unnamed';
                                          const designation = element?.element_designation || element?.designation || '';
                                          const description = element?.element_description_long || element?.description || '';
                                          const countries = element?.element_countries || element?.countries || [];
                                              
                                              // Additional metadata
                                              const inForce = element?.in_force ?? element?.is_active ?? true;
                                              const effectiveDate = element?.effective_date || element?.entry_into_force || element?.date_in_force || '';
                                              const deadline = element?.deadline || element?.compliance_deadline || element?.transition_deadline || '';
                                              const lastUpdated = element?.last_updated || element?.revision_date || '';
                                          
                                          // Look up source URL from Step 3 mapping first
                                          let elementUrl = element?.source_official || element?.element_url || element?.url;
                                          if (!elementUrl && product.step3Payload?.element_mappings) {
                                            const mapping = product.step3Payload.element_mappings.find(
                                                  (m: any) => m.step2_element_name === name || m.step2_designation === designation
                                            );
                                            if (mapping) {
                                              elementUrl = mapping.source_official;
                                            }
                                          }
                                          
                                          // Find original index in full list for removal
                                          const fullList = editingStep2?.productId === product.id 
                                            ? step2EditData?.compliance_elements || []
                                            : filteredElements;
                                          const originalIndex = fullList.findIndex((el: any) => {
                                            const elName = el?.element_name || el?.name;
                                            const elDes = el?.element_designation || el?.designation;
                                            return (elName === name && elDes === designation) || 
                                                   (elName === name && !elDes && !designation) || 
                                                   (elDes === designation && elDes);
                                          });
                                          
                                          return (
                                                <div key={`${category}-${originalIndex}-${idx}`} className="relative bg-white p-3 ml-4 mt-1 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                              {/* X button for removal in edit mode */}
                                              {editingStep2?.productId === product.id && originalIndex !== -1 && (
                                                <button
                                                  onClick={() => handleRemoveStep2Element(originalIndex)}
                                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                                                  title="Remove element"
                                                >
                                                  <XCircle className="w-4 h-4" />
                                                </button>
                                              )}
                                              
                                                  {/* Link icon - only show if URL exists and not in edit mode */}
                                              {!editingStep2 && elementUrl && (
                                                <div className="absolute top-2 right-2">
                                                      <a 
                                                        href={elementUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-blue-500 hover:text-blue-600"
                                                        title="View compliance element details"
                                                      >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                      </a>
                                                  </div>
                                              )}
                                              
                                                  <div className="pr-8">
                                                    {/* Title row with in-force badge */}
                                                    <div className="flex items-start gap-2 mb-1">
                                                      <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] flex-1">
                                                    {name}
                                                  </h6>
                                                      <Badge className={`text-[9px] border-0 px-1.5 py-0 ${
                                                        inForce ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                      }`}>
                                                        {inForce ? 'In Force' : 'Pending'}
                                                      </Badge>
                                                    </div>
                                                    
                                                  {designation && (
                                                      <p className="text-xs text-gray-500 mb-1.5 font-mono">
                                                      {designation}
                                                    </p>
                                                  )}
                                                    
                                                  {description && (
                                                    <p className="text-xs text-gray-600 mb-2">
                                                        {String(description).substring(0, 200)}{String(description).length > 200 ? '...' : ''}
                                                    </p>
                                                  )}
                                                    
                                                    {/* Metadata row: dates, deadlines */}
                                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mb-2">
                                                      {effectiveDate && (
                                                        <span className="flex items-center gap-1">
                                                          <span className="text-gray-400">Effective:</span>
                                                          <span className="font-mono">{new Date(effectiveDate).toLocaleDateString()}</span>
                                                        </span>
                                                      )}
                                                      {deadline && (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                          <span>Deadline:</span>
                                                          <span className="font-mono font-semibold">{new Date(deadline).toLocaleDateString()}</span>
                                                        </span>
                                                      )}
                                                      {lastUpdated && (
                                                        <span className="flex items-center gap-1">
                                                          <span className="text-gray-400">Updated:</span>
                                                          <span className="font-mono">{new Date(lastUpdated).toLocaleDateString()}</span>
                                                        </span>
                                                      )}
                                                    </div>
                                                    
                                                    {/* Countries */}
                                                  {Array.isArray(countries) && countries.length > 0 && (
                                                      <div className="flex flex-wrap gap-1 mb-2">
                                                      {countries.map((country: any, cidx: number) => (
                                                          <Badge key={cidx} className="bg-blue-50 text-blue-700 text-[10px] border-0 px-1.5 py-0">
                                                          {String(country)}
                                                        </Badge>
                                                      ))}
                                                    </div>
                                                  )}
                                                    
                                                    {/* Related Components */}
                                                    {Array.isArray(element?.related_components) && element.related_components.length > 0 && (
                                                      <div className="pt-2 border-t border-gray-100">
                                                        <span className="text-[9px] text-gray-400 uppercase">Applies to:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                          {element.related_components.map((comp: string, cidx: number) => (
                                                            <Badge key={cidx} className="bg-purple-50 text-purple-700 text-[9px] border-0 px-1.5 py-0">
                                                              {comp}
                                                            </Badge>
                                                          ))}
                                                </div>
                                                      </div>
                                                    )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                        )}
                                        
                                        {isExpanded && elements.length === 0 && (
                                          <div className="ml-6 py-2 text-xs text-gray-400 italic">
                                            No {title.toLowerCase()} found
                                          </div>
                                        )}
                                    </div>
                                  );
                                  };

                                  return (
                                    <div className="space-y-2">
                                      {renderElementGroup('legislation', 'Legislation')}
                                      {renderElementGroup('standard', 'Standards')}
                                      {renderElementGroup('marking', 'Markings')}
                                    </div>
                                  );
                                })()
                              ) : (
                                /* Fallback: Display raw response */
                                <div className="bg-dashboard-view-background p-4 max-h-96 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                                    {product.step2Results.raw_response || JSON.stringify(product.step2Results, null, 2) || 'No data available'}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Expandable Step 4 Results */}
                        {isStep4Expanded && loadingStepDetails.has(`${product.id}-step4`) && (
                          <div className="ml-0 md:ml-6 mt-2 p-8 bg-white flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--dashboard-link-color))]" />
                            <span className="ml-3 text-gray-500">Loading compliance updates...</span>
                          </div>
                        )}
                        {isStep4Expanded && !loadingStepDetails.has(`${product.id}-step4`) && product.step4Results && (
                            <div className="ml-0 md:ml-6 mt-2">
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Updates ({product.step4Results.updates_count || 0})
                                </h5>
                              </div>
                              
                              {product.step4Results.compliance_updates && Array.isArray(product.step4Results.compliance_updates) && product.step4Results.compliance_updates.length > 0 ? (
                                (() => {
                                  // Group updates by regulation/element
                                  const updatesByElement: { [key: string]: any[] } = {};
                                  
                                  product.step4Results.compliance_updates.forEach((update: any) => {
                                    const regulation = update?.regulation || update?.name || 'Unknown Regulation';
                                    if (!updatesByElement[regulation]) {
                                      updatesByElement[regulation] = [];
                                    }
                                    updatesByElement[regulation].push(update);
                                  });

                                  // Sort updates within each element by date ascending (oldest first)
                                  Object.keys(updatesByElement).forEach(key => {
                                    updatesByElement[key].sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateA.localeCompare(dateB); // Ascending
                                    });
                                  });

                                  // Get element types from Step 2 if available
                                  const elementTypes: { [key: string]: string } = {};
                                  if (product.step2Results?.compliance_elements) {
                                    product.step2Results.compliance_elements.forEach((el: any) => {
                                      const name = el?.element_name || el?.name || '';
                                      const type = (el?.element_type || el?.type || '').toLowerCase();
                                      if (name) {
                                        elementTypes[name] = type;
                                      }
                                    });
                                  }

                                  // Categorize elements by type
                                  const legislation: { name: string; updates: any[] }[] = [];
                                  const standards: { name: string; updates: any[] }[] = [];
                                  const markings: { name: string; updates: any[] }[] = [];

                                  Object.entries(updatesByElement).forEach(([elementName, updates]) => {
                                    const type = elementTypes[elementName] || '';
                                    const item = { name: elementName, updates };
                                    
                                    if (type.includes('legislation') || type.includes('regulation') || type.includes('directive')) {
                                      legislation.push(item);
                                    } else if (type.includes('standard')) {
                                      standards.push(item);
                                    } else if (type.includes('marking')) {
                                      markings.push(item);
                                    } else {
                                      // Default: try to guess from name
                                      if (elementName.toLowerCase().includes('regulation') || 
                                          elementName.toLowerCase().includes('directive') || 
                                          elementName.toLowerCase().includes('law')) {
                                        legislation.push(item);
                                      } else if (elementName.toLowerCase().includes('standard') || 
                                                 elementName.toLowerCase().includes('iso') || 
                                                 elementName.toLowerCase().includes('en ')) {
                                        standards.push(item);
                                      } else if (elementName.toLowerCase().includes('marking') || 
                                                 elementName.toLowerCase().includes('label')) {
                                        markings.push(item);
                                      } else {
                                        legislation.push(item); // Default to legislation
                                      }
                                    }
                                  });

                                  // Render horizontal timeline for a single element's updates
                                  const renderElementTimeline = (elementName: string, updates: any[], elementType: string) => {
                                    // Find the index of the first future update (next upcoming)
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    
                                    // Sort updates chronologically
                                    const sortedUpdates = [...updates].sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateA.localeCompare(dateB);
                                    });
                                    
                                    // Find first future update index
                                    let firstFutureIdx = sortedUpdates.findIndex((update: any) => {
                                      const updateDate = update?.update_date || update?.date || '';
                                      if (!updateDate) return false;
                                      return new Date(updateDate) >= today;
                                    });
                                    
                                    return (
                                      <div key={elementName} className="mb-4 bg-white p-3">
                                        {/* Element header */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                          <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                            <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                              {elementName}
                                        </h6>
                                            <Badge className={`text-[9px] border-0 px-1.5 py-0 ${
                                              elementType.includes('legislation') || elementType.includes('regulation') ? 'bg-blue-50 text-blue-700' :
                                              elementType.includes('standard') ? 'bg-purple-50 text-purple-700' :
                                              'bg-cyan-50 text-cyan-700'
                                            }`}>
                                              {elementType.includes('legislation') || elementType.includes('regulation') ? 'Legislation' :
                                               elementType.includes('standard') ? 'Standard' : 'Marking'}
                                            </Badge>
                                        </div>
                                          <span className="text-[10px] text-gray-400">{sortedUpdates.length} update{sortedUpdates.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        
                                        {/* Horizontal scrolling updates */}
                                        <div 
                                          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" 
                                          style={{ scrollbarWidth: 'thin' }}
                                          ref={(el) => {
                                            // Auto-scroll to show the next upcoming update
                                            if (el && firstFutureIdx > 0) {
                                              const scrollTarget = firstFutureIdx * 180; // Approximate card width + gap
                                              el.scrollLeft = Math.max(0, scrollTarget - 100);
                                            }
                                          }}
                                        >
                                          {sortedUpdates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const sourceUrl = update?.source || update?.source_url || update?.url;
                                                  const status = update?.status || '';
                                                  const isMandatory = update?.is_mandatory;

                                                  // Check if this update is new/changed
                                                  const updateKey = getUpdateKey(update);
                                                  const productNewIds = newUpdateIds.get(product.id);
                                                  const isNewUpdate = productNewIds?.has(updateKey) || false;
                                                  
                                            // Check if this is the next upcoming update
                                            const isNextUpcoming = idx === firstFutureIdx;
                                            const isFuture = updateDate && new Date(updateDate) >= today;
                                            const isPast = updateDate && new Date(updateDate) < today;
                                            
                                            // Calculate days until/ago
                                            let daysText = '';
                                            if (updateDate) {
                                                                    const targetDate = new Date(updateDate);
                                                                    targetDate.setHours(0, 0, 0, 0);
                                                                    const diffTime = targetDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                    
                                                                    if (diffDays > 0) {
                                                daysText = `in ${diffDays}d`;
                                                                    } else if (diffDays < 0) {
                                                                      daysText = `${Math.abs(diffDays)}d ago`;
                                                                    } else {
                                                                      daysText = 'today';
                                              }
                                            }
                                                  
                                                  return (
                                                    <TooltipProvider key={idx}>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                    <div 
                                                      className={`flex-shrink-0 w-44 p-2.5 border-l-3 cursor-pointer transition-all ${
                                                        isNextUpcoming ? 'ring-2 ring-blue-300 ring-offset-1' : ''
                                                      } ${
                                                        isNewUpdate ? 'bg-orange-50' : isPast ? 'bg-gray-50' : 'bg-white'
                                                      } ${
                                                        impact && impact.toUpperCase() === 'HIGH' ? 'border-l-red-500' :
                                                        impact && impact.toUpperCase() === 'MEDIUM' ? 'border-l-yellow-500' :
                                                        impact ? 'border-l-green-500' : 'border-l-blue-400'
                                                      }`}
                                                      style={{ borderLeftWidth: '3px' }}
                                                    >
                                                      {/* Date header */}
                                                      <div className="flex items-center justify-between mb-1.5">
                                                        <span className={`text-[10px] font-mono ${
                                                          isNextUpcoming ? 'text-blue-600 font-bold' : 
                                                          isFuture ? 'text-gray-600' : 'text-gray-400'
                                                        }`}>
                                                          {updateDate || 'No date'}
                                                        </span>
                                                            {isNewUpdate && (
                                                          <Badge className="bg-orange-500 text-white border-0 text-[7px] px-1 py-0">
                                                                  NEW
                                                                </Badge>
                                                        )}
                                                        {isNextUpcoming && !isNewUpdate && (
                                                          <Badge className="bg-blue-500 text-white border-0 text-[7px] px-1 py-0">
                                                            NEXT
                                                          </Badge>
                                                        )}
                                                      </div>
                                                      
                                                      {/* Days indicator */}
                                                      {daysText && (
                                                        <div className={`text-[9px] mb-1 ${
                                                          isNextUpcoming ? 'text-blue-500 font-semibold' : 'text-gray-400'
                                                        }`}>
                                                          {daysText}
                                                      </div>
                                                      )}
                                                      
                                                      {/* Title */}
                                                      <p className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                                                        isPast ? 'text-gray-500' : 'text-[hsl(var(--dashboard-link-color))]'
                                                      }`}>
                                                        {title || description.slice(0, 60) + '...'}
                                                      </p>
                                                      
                                                      {/* Type badge on card */}
                                                      <Badge className={`text-[8px] border-0 px-1 py-0 mt-1.5 ${
                                                        elementType.includes('legislation') || elementType.includes('regulation') ? 'bg-blue-100 text-blue-700' :
                                                        elementType.includes('standard') ? 'bg-purple-100 text-purple-700' :
                                                        'bg-cyan-100 text-cyan-700'
                                                      }`}>
                                                        {elementType.includes('legislation') || elementType.includes('regulation') ? 'Legislation' :
                                                         elementType.includes('standard') ? 'Standard' : 'Marking'}
                                                                </Badge>
                                                      
                                                      {/* Link if available */}
                                                            {sourceUrl && (
                                                                <a 
                                                                  href={sourceUrl} 
                                                                  target="_blank" 
                                                                  rel="noopener noreferrer"
                                                                  onClick={(e) => e.stopPropagation()}
                                                          className="inline-flex items-center gap-0.5 text-[9px] text-blue-500 hover:text-blue-600 mt-1"
                                                        >
                                                          <ExternalLink className="w-2.5 h-2.5" />
                                                          Source
                                                        </a>
                                                      )}
                                                          </div>
                                                        </TooltipTrigger>
                                                  <TooltipContent side="bottom" className="max-w-sm bg-white border border-gray-200 shadow-lg p-3">
                                                    <p className="text-sm font-bold text-[hsl(var(--dashboard-link-color))] mb-1">{title}</p>
                                                    {description && <p className="text-xs text-gray-600 mb-2">{description.substring(0, 200)}...</p>}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                      <Badge className={`text-[9px] border-0 px-1.5 py-0.5 ${
                                                        elementType.includes('legislation') || elementType.includes('regulation') ? 'bg-blue-100 text-blue-700' :
                                                        elementType.includes('standard') ? 'bg-purple-100 text-purple-700' :
                                                        'bg-cyan-100 text-cyan-700'
                                                      }`}>
                                                        {elementType.includes('legislation') || elementType.includes('regulation') ? 'Legislation' :
                                                         elementType.includes('standard') ? 'Standard' : 'Marking'}
                                                      </Badge>
                                                        {impact && (
                                                        <Badge className={`text-[9px] border-0 px-1.5 py-0.5 ${
                                                          impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                          impact.toUpperCase() === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                          'bg-green-100 text-green-700'
                                                        }`}>
                                                          {impact.toUpperCase()} Impact
                                                        </Badge>
                                                      )}
                                                      {status && (
                                                        <Badge className="text-[9px] border-0 px-1.5 py-0.5 bg-gray-100 text-gray-700">
                                                          {status}
                                                        </Badge>
                                                      )}
                                                      {isMandatory !== undefined && (
                                                        <Badge className={`text-[9px] border-0 px-1.5 py-0.5 ${
                                                          isMandatory ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                          {isMandatory ? 'Mandatory' : 'Optional'}
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  );
                                                })}
                                      </div>
                                    </div>
                                  );
                                  };

                                  // Combine all elements with updates for the list view
                                  const allElementsWithUpdates = [...legislation, ...standards, ...markings];

                                  // Sort elements by number of updates (most first)
                                  allElementsWithUpdates.sort((a, b) => b.updates.length - a.updates.length);

                                  return (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                                        <span className="text-xs text-gray-500">
                                          {allElementsWithUpdates.length} compliance element{allElementsWithUpdates.length !== 1 ? 's' : ''} with updates
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          Scroll horizontally to see timeline
                                        </span>
                                          </div>
                                      {allElementsWithUpdates.map((element) => {
                                        const type = elementTypes[element.name] || '';
                                        return renderElementTimeline(element.name, element.updates, type);
                                      })}
                                          </div>
                                  );
                                })()
                              ) : (
                                <div className="bg-dashboard-view-background p-6 text-center">
                                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-sm text-gray-600 mb-2">No compliance updates data available</p>
                                  <p className="text-xs text-gray-400">
                                    {product.step4Results?.updates_count > 0
                                      ? 'Try reloading the page or re-running Step 4'
                                      : 'Run Step 4 to identify compliance updates'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="mt-4 text-xs text-gray-400">
                        Created: {new Date(product.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Action Buttons - Top Right Corner (fixed position) */}
                    <div className="flex gap-2 flex-shrink-0 items-start absolute top-3 right-3 md:top-6 md:right-6">
                      {/* SIMPLE CONTINUE BUTTON - Shows if ANY step is not completed */}
                      {(() => {
                        // Check if all steps are completed
                        const allDone = 
                          step0StatusLower === 'completed' && 
                          step1StatusLower === 'completed' && 
                          step2StatusLower === 'completed' && 
                          step3StatusLower === 'completed' && 
                          step4StatusLower === 'completed';
                        
                        // Check if any step is running
                        const anyRunning = 
                          step0StatusLower === 'running' || 
                          step1StatusLower === 'running' || 
                          step2StatusLower === 'running' || 
                          step3StatusLower === 'running' || 
                          step4StatusLower === 'running';
                        
                        // Find which step to run next
                        let nextStep = -1;
                        let stepLabel = 'Continue';
                        
                        if (step0StatusLower !== 'completed') {
                          nextStep = 0;
                          stepLabel = 'Start Analysis';
                        } else if (step1StatusLower !== 'completed') {
                          nextStep = 1;
                          stepLabel = 'Run Step 1';
                        } else if (step2StatusLower !== 'completed') {
                          nextStep = 2;
                          stepLabel = 'Run Step 2';
                        } else if (step3StatusLower !== 'completed') {
                          nextStep = 3;
                          stepLabel = 'Run Step 3';
                        } else if (step4StatusLower !== 'completed') {
                          nextStep = 4;
                          stepLabel = 'Run Step 4';
                        }
                        
                        // If all done, show Re-run All (green outline style)
                        if (allDone) {
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRerunAll(product.id)}
                              className="border-green-300 bg-green-50 text-green-600 hover:bg-green-100"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Re-run All
                            </Button>
                          );
                        }
                        
                        // If something is running, show status
                        if (anyRunning) {
                          return (
                            <Button size="sm" disabled className="bg-blue-100 text-blue-600 border-0">
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Processing...
                            </Button>
                          );
                        }
                        
                        // Otherwise show Continue button
                        return (
                        <Button
                          size="sm"
                          onClick={() => {
                              if (nextStep === 0) handleStartStep0(product.id);
                              else if (nextStep === 1) handleStartStep1(product.id);
                              else if (nextStep === 2) handleStartStep2(product.id);
                              else if (nextStep === 3) handleStartStep3(product.id);
                              else if (nextStep === 4) handleStartStep4(product.id);
                          }}
                            className="bg-green-600 hover:bg-green-700 text-white border-0"
                          >
                              <Play className="w-4 h-4 mr-1" />
                            {stepLabel}
                        </Button>
                        );
                      })()}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                            className="border-0 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                            <MoreVertical className="w-4 h-4" />
                      </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-0">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleRerunAll(product.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-run All Steps
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setProductToDuplicate(product);
                              setShowAddDialog(true);
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Share2 className="w-4 h-4 mr-2" />
                            Delegate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => openDeleteDialog(product.id, product.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            // Reset duplicate product when dialog closes
            setProductToDuplicate(null);
          }
        }}
        onProductAdded={handleProductAdded}
        initialProduct={productToDuplicate ? {
          name: productToDuplicate.name,
          description: productToDuplicate.description,
          type: productToDuplicate.type as 'existing' | 'future' | 'imaginary',
          urls: (productToDuplicate as any).urls || [],
          markets: productToDuplicate.markets || [],
          uploaded_files: (productToDuplicate as any).uploaded_files || [],
          uploaded_images: (productToDuplicate as any).uploaded_images || [],
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, productId: '', productName: '' })}>
        <AlertDialogContent className="bg-white border-0">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-50 p-3 border-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              Are you sure you want to delete <span className="font-bold text-[hsl(var(--dashboard-link-color))]">"{deleteDialog.productName}"</span>?
              <br /><br />
              The product will be hidden from your interface but kept as a backup in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="border-0 bg-gray-100 text-gray-700 hover:bg-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Component Info Modal - How to Improve Comprehensiveness */}
      <AlertDialog open={componentInfoModal.open} onOpenChange={(open) => !open && setComponentInfoModal({ open: false, componentName: '', percentage: 0, missingDetails: '' })}>
        <AlertDialogContent className="bg-white border-0 max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 border-0 ${
                componentInfoModal.percentage >= 70 ? 'bg-green-50' :
                componentInfoModal.percentage >= 40 ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <Info className={`w-6 h-6 ${
                  componentInfoModal.percentage >= 70 ? 'text-green-600' :
                  componentInfoModal.percentage >= 40 ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
              </div>
              <div>
                <AlertDialogTitle className="text-left">How to Improve: {componentInfoModal.componentName}</AlertDialogTitle>
                <Badge className={`mt-1 text-xs font-mono font-bold border-0 ${
                  componentInfoModal.percentage >= 70 ? 'bg-green-100 text-green-700' :
                  componentInfoModal.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {componentInfoModal.percentage}% Complete
                </Badge>
              </div>
            </div>
            <AlertDialogDescription className="text-left mt-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {componentInfoModal.missingDetails || 'No specific improvement suggestions available for this component.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-0 bg-gray-100 text-gray-700 hover:bg-gray-200">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



