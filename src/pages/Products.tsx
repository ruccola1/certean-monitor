import { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, Trash2, Play, AlertTriangle, FileCheck, XCircle, Eye, EyeOff, ExternalLink, Bell, MoreVertical, Edit, Copy, Share2 } from 'lucide-react';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
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
    element_type?: string;
    type?: string;
    element_description_long?: string;
    description?: string;
    element_countries?: string[];
    countries?: string[];
    [key: string]: any;
  }>;
  elements_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  raw_response?: string;
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
  markets: string[];
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
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<ProductDetails | null>(null);
  const [complianceAreas, setComplianceAreas] = useState<ComplianceArea[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  // const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);
  // Single state to track which step is expanded (only one at a time)
  const [expandedStep, setExpandedStep] = useState<{ productId: string; stepNumber: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: '',
    productName: ''
  });
  
  // Edit mode state
  const [editingStep0, setEditingStep0] = useState<{ productId: string } | null>(null);
  const [editingStep2, setEditingStep2] = useState<{ productId: string } | null>(null);
  
  // Step 0 edit state (local copies for editing)
  const [step0EditData, setStep0EditData] = useState<any>(null);
  
  // Step 2 edit state
  const [step2EditData, setStep2EditData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [manualElementInput, setManualElementInput] = useState<string>('');
  const [manualElementMarket, setManualElementMarket] = useState<string>('');
  const [manualElementType, setManualElementType] = useState<string>('legislation');
  
  const { addNotification } = useNotificationContext();
  const previousStatusesRef = useRef<Map<string, {
    step0: string | undefined;
    step1: string | undefined;
    step2: string | undefined;
    step3: string | undefined;
    step4: string | undefined;
  }>>(new Map());

  const fetchProducts = async () => {
    try {
      // Set API key
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      const response = await productService.getAll(clientId);
      setProducts((response.data || []) as unknown as ProductDetails[]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch products immediately when component mounts
    fetchProducts();
    fetchComplianceAreas();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

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
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchProducts);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchProducts);
    };
  }, []);

  // Detect status changes and send notifications
  useEffect(() => {
    products.forEach(product => {
      const productId = product.id;
      const previousStatuses = previousStatusesRef.current.get(productId);
      
      if (!previousStatuses) {
        // First time seeing this product, store its current statuses
        previousStatusesRef.current.set(productId, {
          step0: product.step0Status,
          step1: product.step1Status,
          step2: product.step2Status,
          step3: product.step3Status,
          step4: product.step4Status,
        });
        return;
      }
      
      // Check each step for status changes
      const steps = [
        { num: 0, current: product.step0Status, previous: previousStatuses.step0, name: 'Product Details' },
        { num: 1, current: product.step1Status, previous: previousStatuses.step1, name: 'Compliance Assessment' },
        { num: 2, current: product.step2Status, previous: previousStatuses.step2, name: 'Compliance Elements' },
        { num: 3, current: product.step3Status, previous: previousStatuses.step3, name: 'Element Mapping' },
        { num: 4, current: product.step4Status, previous: previousStatuses.step4, name: 'Compliance Updates' },
      ];
      
      steps.forEach(step => {
        // Detect completed steps
        if (step.previous === 'running' && step.current === 'completed') {
          addNotification({
            type: 'success',
            title: `${step.name} Completed`,
            message: `${product.name}: ${step.name} finished successfully`,
            productId: product.id,
            productName: product.name,
            step: step.num,
          });
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

  const handleProductAdded = () => {
    setShowAddDialog(false);
    setProductToDuplicate(null); // Reset duplicate state
    fetchProducts(); // Refresh the list
  };

  const handleRemoveCategory = async (productId: string, category: string) => {
    try {
      await apiService.getInstance().patch(`/api/products/${productId}/remove-category`, {
        category
      });
      console.log('Category removed:', category);
      fetchProducts();
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
      fetchProducts();
    } catch (error) {
      console.error('Failed to remove material:', error);
    }
  };

  // Step 0 Edit Mode Handlers
  const handleStartEditStep0 = (productId: string) => {
    console.log('🖊️ Starting edit mode for Step 0, product:', productId);
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }
    if (!product.step0Results) {
      console.error('step0Results not found for product:', productId);
      return;
    }
    
    console.log('Setting edit mode state...');
    // Create editable copy first
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
    
    try {
      const clientId = getClientId(user);
      
      // Update step0Results
      const step0Results = {
        ...product.step0Results,
        categories: step0EditData.categories,
        materials: step0EditData.materials,
        product_overview: step0EditData.product_overview || undefined,
        research_sources: Array.isArray(step0EditData.research_sources) ? step0EditData.research_sources.length : (step0EditData.research_sources || 0),
        product_decomposition: step0EditData.product_decomposition || undefined,
      };
      
      // Update step0Payload (used by next step) - create if doesn't exist
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
      
      addNotification({ 
        title: 'Product Details Updated',
        message: 'Product Details changes saved successfully. Step 1 will start automatically.',
        type: 'success',
        productId: productId,
        productName: product.name,
        step: 0
      });
      setEditingStep0(null);
      setStep0EditData(null);
      
      // Auto-trigger Step 1 is now handled by the backend upon update
      // Step 1 will be started by the backend background task
      
      fetchProducts();
    } catch (error) {
      console.error('Failed to save Step 0:', error);
      addNotification({ 
        title: 'Product Details Update Failed',
        message: 'Failed to save Product Details changes',
        type: 'error',
        productId: productId,
        productName: product.name,
        step: 0
      });
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
      fetchProducts();
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
    try {
      console.log('🚀 Starting Step 0 for product:', productId);
      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      console.log('🔑 Using clientId (company):', clientId);
      const response = await productService.executeStep0(productId, clientId);
      console.log('✅ Step 0 started successfully:', response);
      fetchProducts();
    } catch (error) {
      console.error('❌ Failed to start Step 0:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as any)?.response?.data
      });
      alert(`Failed to start Step 0: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleStartStep1 = async (productId: string) => {
    try {
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step1`);
      console.log('Step 1 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 1:', error);
    }
  };

  const handleStartStep2 = async (productId: string) => {
    try {
      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step2?client_id=${clientId}`);
      console.log('Step 2 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 2:', error);
    }
  };

  const handleStartStep3 = async (productId: string) => {
    try {
      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step3?client_id=${clientId}`);
      console.log('Step 3 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 3:', error);
    }
  };

  const handleStartStep4 = async (productId: string) => {
    try {
      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step4?client_id=${clientId}`);
      console.log('Step 4 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 4:', error);
    }
  };

  const openDeleteDialog = (productId: string, productName: string) => {
    setDeleteDialog({ open: true, productId, productName });
  };

  const confirmDelete = async () => {
    try {
      await productService.delete(deleteDialog.productId);
      console.log('Product deleted:', deleteDialog.productId);
      // Close dialog
      setDeleteDialog({ open: false, productId: '', productName: '' });
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
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
    <div className="min-h-screen bg-dashboard-view-background p-4 md:p-8">
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
        {products.length === 0 ? (
          <Card className="bg-white border-0">
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
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const step0Status = product.step0Status || 'pending';
              const step2Status = product.step2Status || 'pending';
              const step3Status = product.step3Status || 'pending';
              const step4Status = product.step4Status || 'pending';
              const step2StatusLower = step2Status.toLowerCase();
              const step3StatusLower = step3Status.toLowerCase();
              const step4StatusLower = step4Status.toLowerCase();
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
              const canStartStep4 = product.step2Status === 'completed';

              return (
              <Card key={product.id} className="bg-white border-0">
                <CardContent className="p-3 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 text-[hsl(var(--dashboard-link-color))] font-medium">
                            {product.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Markets:</span>
                          <span className="ml-2 text-[hsl(var(--dashboard-link-color))] font-medium">
                            {product.markets.join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-1 md:gap-3 pb-2 w-full">
                          {/* Step 0 summary */}
                          <div className="bg-white border border-gray-100 p-2 md:p-4 h-full overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                  Product Details
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
                                      <span className="text-[10px] text-gray-400 hidden md:inline">quality score</span>
                                    </>
                                  ) : (
                                    <p className="text-sm md:text-2xl font-mono text-[hsl(var(--dashboard-link-color))] truncate">
                                      {step0Status === 'completed' ? '100%' : step0Status.toUpperCase()}
                                    </p>
                                  )}
                                </div>
                                <p className="hidden md:block text-xs text-gray-500 mt-1 truncate">
                                  {product.step0Results?.quality_reasoning || "Review and edit before continuing."}
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
                                onClick={() =>
                                  setExpandedStep(
                                    isStep0Expanded ? null : { productId: product.id, stepNumber: 0 }
                                  )
                                }
                                className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                              >
                                <span className="md:hidden">View</span>
                                <span className="hidden md:inline">{isStep0Expanded ? 'Hide details' : 'View details'}</span>
                              </Button>
                              {!isStep2Running && step2StatusLower !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep2(product.id)}
                                  className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  <span className="md:hidden">Continue</span>
                                  <span className="hidden md:inline">Continue</span>
                                </Button>
                              )}
                              {isStep2Running && (
                                <Button size="sm" disabled className="text-xs h-7">
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                  Finding compliance elements...
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Step 2 summary */}
                          <div className="bg-white border border-gray-100 p-2 md:p-4 h-full overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                  Compliance Elements
                                </p>
                                <p className="text-sm md:text-2xl font-mono text-[hsl(var(--dashboard-link-color))] truncate">
                                  {complianceElementsCount}
                                </p>
                                <p className="hidden md:block text-xs text-gray-500 mt-1">elements identified</p>
                              </div>
                              <div className="scale-75 origin-top-left md:scale-100 shrink-0">
                              {getStatusBadge(product.step2Status)}
                            </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-3">
                              {step2StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedStep(
                                      isStep2Expanded ? null : { productId: product.id, stepNumber: 2 }
                                    )
                                  }
                                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200 text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  <span className="md:hidden">View</span>
                                  <span className="hidden md:inline">{isStep2Expanded ? 'Hide elements' : 'View elements'}</span>
                                </Button>
                              )}
                              {isStep2Running && (
                                <Button size="sm" disabled className="text-[10px] md:text-xs px-2 h-6 md:h-7 w-full md:w-auto">
                                  <Loader2 className="w-3 h-3 mr-1 md:mr-2 animate-spin" />
                                  <span className="md:hidden">Running...</span>
                                  <span className="hidden md:inline">Finding elements...</span>
                                </Button>
                              )}
                              {!isStep2Running && step2StatusLower !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep2(product.id)}
                                  className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  {step2StatusLower === 'error' ? (
                                    <>
                                      <span className="md:hidden">Retry</span>
                                      <span className="hidden md:inline">Retry compliance elements</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="md:hidden">Find</span>
                                      <span className="hidden md:inline">Find compliance elements</span>
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Step 4 summary */}
                          <div className="bg-white border border-gray-100 p-2 md:p-4 h-full overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-1 md:gap-2 mb-2 md:mb-0">
                              <div className="min-w-0 w-full">
                                <p className="text-[9px] md:text-[10px] font-semibold uppercase text-gray-500 truncate">
                                  Compliance Updates
                                </p>
                                <p className="text-sm md:text-2xl font-mono text-[hsl(var(--dashboard-link-color))] truncate">
                                  {complianceUpdatesCount}
                                </p>
                                <p className="hidden md:block text-xs text-gray-500 mt-1">updates tracked</p>
                              </div>
                              <div className="scale-75 origin-top-left md:scale-100 shrink-0">
                                {getStatusBadge(product.step4Status)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-3">
                              {step4StatusLower === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedStep(
                                      isStep4Expanded ? null : { productId: product.id, stepNumber: 4 }
                                    )
                                  }
                                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200 text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  <span className="md:hidden">View</span>
                                  <span className="hidden md:inline">{isStep4Expanded ? 'Hide updates' : 'View updates'}</span>
                                </Button>
                              )}
                              {!canStartStep4 ? (
                                <Button size="sm" disabled className="text-[10px] md:text-xs px-2 h-6 md:h-7 w-full md:w-auto truncate" title="Run compliance elements first">
                                  <span className="md:hidden">Wait for Step 2</span>
                                  <span className="hidden md:inline">Run compliance elements first</span>
                                </Button>
                              ) : (isStep3Running || isStep4Running) ? (
                                <Button size="sm" disabled className="text-[10px] md:text-xs px-2 h-6 md:h-7 w-full md:w-auto">
                                  <Loader2 className="w-3 h-3 mr-1 md:mr-2 animate-spin" />
                                  <span className="md:hidden">Running...</span>
                                  <span className="hidden md:inline">Generating updates...</span>
                                </Button>
                              ) : step4StatusLower !== 'completed' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStep3(product.id)}
                                  className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-[10px] md:text-xs px-2 h-6 md:h-8 w-full md:w-auto"
                                >
                                  {step4StatusLower === 'error' ? (
                                    <>
                                      <span className="md:hidden">Retry</span>
                                      <span className="hidden md:inline">Retry updates</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="md:hidden">Generate</span>
                                      <span className="hidden md:inline">Generate compliance updates</span>
                                    </>
                                  )}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Step 0 Results */}
                        {isStep0Expanded && product.step0Results && (
                            <div className="ml-0 md:ml-6 mt-2 space-y-4">
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
                                      className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs px-3 py-1.5 h-7"
                                >
                                      Save
                                </Button>
                                <Button
                                  onClick={(e) => {
                                        e.preventDefault();
                                    e.stopPropagation();
                                        handleCancelEditStep0();
                                  }}
                                      size="sm"
                                      variant="outline"
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
                                  (!editingStep0 && product.step0Results.categories && product.step0Results.categories.length > 0)) && (
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
                                  (!editingStep0 && product.step0Results.materials && product.step0Results.materials.length > 0)) && (
                                  <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="text-xs font-semibold text-gray-600">Materials</h6>
                                      {editingStep0?.productId === product.id && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={handleAddMaterial}
                                            className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 hover:bg-purple-200 border-0"
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
                                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded min-w-[100px]"
                                            placeholder="Material name"
                                          />
                                        ) : (
                                        <Badge 
                                          key={idx} 
                                          className="bg-purple-100 text-purple-700 border-0 flex items-center gap-1 pr-1"
                                        >
                                          {material}
                                          <button
                                            onClick={() => handleRemoveMaterial(product.id, material)}
                                            className="ml-1 hover:bg-purple-200 p-0.5"
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
                                (!editingStep0 && (product.step0Results.product_overview || product.description))) && (
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
                                (!editingStep0 && product.components && product.components.length > 0)) && (
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                      Components ({(editingStep0?.productId === product.id ? step0EditData?.components : product.components)?.length || 0})
                                  </h5>
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
                                  <div className="space-y-3">
                                    {(editingStep0?.productId === product.id ? step0EditData?.components : product.components)?.map((component: any, idx: number) => (
                                      <div key={idx} className="bg-dashboard-view-background p-4 relative">
                                        {editingStep0?.productId === product.id && (
                                          <button
                                            onClick={() => handleRemoveStep0Section('component', idx)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                                            title="Remove component"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                        
                                        {editingStep0?.productId === product.id ? (
                                          <div className="space-y-3">
                                            <div>
                                              <label className="text-xs font-semibold text-gray-600 block mb-1">Component Name</label>
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
                                              <input
                                                type="text"
                                                value={component.materials || ''}
                                                onChange={(e) => handleUpdateComponent(idx, 'materials', e.target.value)}
                                                className="w-full text-xs px-2 py-1 bg-white border border-gray-300"
                                                placeholder="Materials used"
                                              />
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
                                        <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                          {component.name || `Component ${idx + 1}`}
                                        </h6>
                                        
                                        {/* Description */}
                                        {component.description && (
                                          <div className="mb-3">
                                            <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                              {component.description}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Materials */}
                                        {component.materials && (
                                          <div className="mb-3">
                                            <span className="text-xs font-semibold text-gray-600">Materials: </span>
                                            <span className="text-xs text-gray-700">{component.materials}</span>
                                          </div>
                                        )}
                                        
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
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Research Sources */}
                              {((editingStep0?.productId === product.id) || 
                                (!editingStep0 && product.step0Payload?.research_sources && product.step0Payload.research_sources.length > 0)) && (
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
                                (!editingStep0 && product.step0Results?.product_decomposition)) && (
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
                        {isStep2Expanded && product.step2Results && (
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

                                  const renderElementColumn = (category: string, title: string) => (
                                    <div key={category}>
                                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                        <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                        <h6 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                          {title}
                                      </h6>
                                        <span className="text-xs text-gray-400">({grouped[category]?.length || 0})</span>
                                      </div>
                                      <div className="space-y-4">
                                        {grouped[category]?.map((element: any, idx: number) => {
                                          const name = element?.element_name || element?.name || 'Unnamed';
                                          const designation = element?.element_designation || element?.designation || '';
                                          const description = element?.element_description_long || element?.description || '';
                                          const countries = element?.element_countries || element?.countries || [];
                                          
                                          // Look up source URL from Step 3 mapping first
                                          let elementUrl = element?.source_official || element?.element_url || element?.url;
                                          if (!elementUrl && product.step3Payload?.element_mappings) {
                                            const mapping = product.step3Payload.element_mappings.find(
                                              m => m.step2_element_name === name || m.step2_designation === designation
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
                                            <div key={`${category}-${originalIndex}-${idx}`} className="relative bg-white p-3 transition-colors hover:bg-gray-50">
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
                                              
                                              {/* Link icon in top right corner - only show if URL exists and not in edit mode */}
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
                                              
                                              <div className="flex items-start gap-2 pr-6">
                                                <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                  <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                                    {name}
                                                  </h6>
                                                  {designation && (
                                                    <p className="text-xs text-gray-500 mb-2">
                                                      {designation}
                                                    </p>
                                                  )}
                                                  {description && (
                                                    <p className="text-xs text-gray-600 mb-2">
                                                      {String(description).substring(0, 150)}{String(description).length > 150 ? '...' : ''}
                                                    </p>
                                                  )}
                                                  {Array.isArray(countries) && countries.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                      {countries.map((country: any, cidx: number) => (
                                                        <Badge key={cidx} className="bg-blue-50 text-blue-700 text-xs border-0">
                                                          {String(country)}
                                                        </Badge>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );

                                  return (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {renderElementColumn('legislation', 'Legislation')}
                                      {renderElementColumn('standard', 'Standards')}
                                      {renderElementColumn('marking', 'Markings')}
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
                        {isStep4Expanded && product.step4Results && (
                            <div className="ml-0 md:ml-6 mt-2">
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Updates ({product.step4Results.updates_count || 0})
                                </h5>
                              </div>
                              
                              {product.step4Results.compliance_updates && Array.isArray(product.step4Results.compliance_updates) && product.step4Results.compliance_updates.length > 0 ? (
                                (() => {
                                  // Helper function to filter updates by date
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  
                                  const filterUpdatesByDate = (updates: any[], isFuture: boolean) => {
                                    return updates.filter((update: any) => {
                                      const updateDate = update?.update_date || update?.date || '';
                                      if (!updateDate) return !isFuture; // No date = show in previous
                                      const date = new Date(updateDate);
                                      return isFuture ? date >= today : date < today;
                                    });
                                  };
                                  
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

                                  // Function to render columns for a given set of updates (filtered by date)
                                  const renderColumns = (legislationData: { name: string; updates: any[] }[], standardsData: { name: string; updates: any[] }[], markingsData: { name: string; updates: any[] }[]) => (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Legislation Column */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                          <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                          <h6 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                            Legislation
                                        </h6>
                                          <span className="text-xs text-gray-400">({legislationData.length})</span>
                                        </div>
                                        <div className="space-y-4">
                                          {legislationData.map((element, elIdx) => (
                                            <div key={elIdx} className="space-y-2">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wide mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-1.5">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const sourceUrl = update?.source || update?.source_url || update?.url;
                                                  
                                                  return (
                                                    <TooltipProvider key={idx}>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className={`relative bg-white p-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                                                            impact && impact.toUpperCase() === 'HIGH' ? 'border-red-500' :
                                                            impact && impact.toUpperCase() === 'MEDIUM' ? 'border-yellow-500' :
                                                            impact ? 'border-green-500' : 'border-blue-500'
                                                          }`}>
                                                            {/* Link icon in top right corner - only show if URL exists */}
                                                            {sourceUrl && (
                                                              <div className="absolute top-2 right-2">
                                                                <a 
                                                                  href={sourceUrl} 
                                                                  target="_blank" 
                                                                  rel="noopener noreferrer"
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="text-blue-500 hover:text-blue-600"
                                                                  title="View update source"
                                                                >
                                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                              </div>
                                                            )}
                                                            
                                                            <div className="flex items-start gap-3 pr-6">
                                                              <Bell className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                              <div className="flex-1 min-w-0">
                                                                <div className="mb-1.5">
                                                                  {updateDate && (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const targetDate = new Date(updateDate);
                                                                    targetDate.setHours(0, 0, 0, 0);
                                                                    const diffTime = targetDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                    
                                                                    let daysText = '';
                                                                    if (diffDays > 0) {
                                                                      daysText = `${diffDays}d`;
                                                                    } else if (diffDays < 0) {
                                                                      daysText = `${Math.abs(diffDays)}d ago`;
                                                                    } else {
                                                                      daysText = 'today';
                                                                    }
                                                                    
                                                                    return (
                                                                      <span className="text-xs text-gray-500">
                                                                        {updateDate} <span className="text-[10px] text-gray-400 ml-1">({daysText})</span>
                                                                      </span>
                                                                    );
                                                                  })()}
                                                      </div>
                                                          <p className="text-[13px] font-semibold text-[hsl(var(--dashboard-link-color))] leading-snug mb-1.5">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                                {description && title && (
                                                                  <p className="text-xs text-gray-600 leading-relaxed">
                                                                    {String(description).substring(0, 200)}{String(description).length > 200 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                            </div>
                                                          </div>
                                                        </TooltipTrigger>
                                                        {impact && (
                                                          <TooltipContent>
                                                            <p className="text-xs">{impact.toUpperCase()} Impact</p>
                                                          </TooltipContent>
                                                        )}
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Standards Column */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                          <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                          <h6 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                            Standards
                                        </h6>
                                          <span className="text-xs text-gray-400">({standardsData.length})</span>
                                        </div>
                                        <div className="space-y-4">
                                          {standardsData.map((element, elIdx) => (
                                            <div key={elIdx} className="space-y-2">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wide mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-1.5">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const sourceUrl = update?.source || update?.source_url || update?.url;
                                                  
                                                  return (
                                                    <TooltipProvider key={idx}>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className={`relative bg-white p-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                                                            impact && impact.toUpperCase() === 'HIGH' ? 'border-red-500' :
                                                            impact && impact.toUpperCase() === 'MEDIUM' ? 'border-yellow-500' :
                                                            impact ? 'border-green-500' : 'border-blue-500'
                                                          }`}>
                                                            {/* Link icon in top right corner - only show if URL exists */}
                                                            {sourceUrl && (
                                                              <div className="absolute top-2 right-2">
                                                                <a 
                                                                  href={sourceUrl} 
                                                                  target="_blank" 
                                                                  rel="noopener noreferrer"
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="text-blue-500 hover:text-blue-600"
                                                                  title="View update source"
                                                                >
                                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                              </div>
                                                            )}
                                                            
                                                            <div className="flex items-start gap-3 pr-6">
                                                              <Bell className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                              <div className="flex-1 min-w-0">
                                                                <div className="mb-1.5">
                                                                  {updateDate && (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const targetDate = new Date(updateDate);
                                                                    targetDate.setHours(0, 0, 0, 0);
                                                                    const diffTime = targetDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                    
                                                                    let daysText = '';
                                                                    if (diffDays > 0) {
                                                                      daysText = `${diffDays}d`;
                                                                    } else if (diffDays < 0) {
                                                                      daysText = `${Math.abs(diffDays)}d ago`;
                                                                    } else {
                                                                      daysText = 'today';
                                                                    }
                                                                    
                                                                    return (
                                                                      <span className="text-xs text-gray-500">
                                                                        {updateDate} <span className="text-[10px] text-gray-400 ml-1">({daysText})</span>
                                                                      </span>
                                                                    );
                                                                  })()}
                                                      </div>
                                                          <p className="text-[13px] font-semibold text-[hsl(var(--dashboard-link-color))] leading-snug mb-1.5">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                                {description && title && (
                                                                  <p className="text-xs text-gray-600 leading-relaxed">
                                                                    {String(description).substring(0, 200)}{String(description).length > 200 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                            </div>
                                                          </div>
                                                        </TooltipTrigger>
                                                        {impact && (
                                                          <TooltipContent>
                                                            <p className="text-xs">{impact.toUpperCase()} Impact</p>
                                                          </TooltipContent>
                                                        )}
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Markings Column */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                          <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))]" />
                                          <h6 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                                            Markings
                                        </h6>
                                          <span className="text-xs text-gray-400">({markingsData.length})</span>
                                        </div>
                                        <div className="space-y-4">
                                          {markingsData.map((element, elIdx) => (
                                            <div key={elIdx} className="space-y-2">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wide mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-1.5">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const sourceUrl = update?.source || update?.source_url || update?.url;
                                                  
                                                  return (
                                                    <TooltipProvider key={idx}>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className={`relative bg-white p-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                                                            impact && impact.toUpperCase() === 'HIGH' ? 'border-red-500' :
                                                            impact && impact.toUpperCase() === 'MEDIUM' ? 'border-yellow-500' :
                                                            impact ? 'border-green-500' : 'border-blue-500'
                                                          }`}>
                                                            {/* Link icon in top right corner - only show if URL exists */}
                                                            {sourceUrl && (
                                                              <div className="absolute top-2 right-2">
                                                                <a 
                                                                  href={sourceUrl} 
                                                                  target="_blank" 
                                                                  rel="noopener noreferrer"
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  className="text-blue-500 hover:text-blue-600"
                                                                  title="View update source"
                                                                >
                                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                              </div>
                                                            )}
                                                            
                                                            <div className="flex items-start gap-3 pr-6">
                                                              <Bell className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                              <div className="flex-1 min-w-0">
                                                                <div className="mb-1.5">
                                                                  {updateDate && (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const targetDate = new Date(updateDate);
                                                                    targetDate.setHours(0, 0, 0, 0);
                                                                    const diffTime = targetDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                    
                                                                    let daysText = '';
                                                                    if (diffDays > 0) {
                                                                      daysText = `${diffDays}d`;
                                                                    } else if (diffDays < 0) {
                                                                      daysText = `${Math.abs(diffDays)}d ago`;
                                                                    } else {
                                                                      daysText = 'today';
                                                                    }
                                                                    
                                                                    return (
                                                                      <span className="text-xs text-gray-500">
                                                                        {updateDate} <span className="text-[10px] text-gray-400 ml-1">({daysText})</span>
                                                                      </span>
                                                                    );
                                                                  })()}
                                                      </div>
                                                          <p className="text-[13px] font-semibold text-[hsl(var(--dashboard-link-color))] leading-snug mb-1.5">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                                {description && title && (
                                                                  <p className="text-xs text-gray-600 leading-relaxed">
                                                                    {String(description).substring(0, 200)}{String(description).length > 200 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                            </div>
                                                          </div>
                                                        </TooltipTrigger>
                                                        {impact && (
                                                          <TooltipContent>
                                                            <p className="text-xs">{impact.toUpperCase()} Impact</p>
                                                          </TooltipContent>
                                                        )}
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );

                                  // Filter data for Future and Previous tabs
                                  const futureLegislation = legislation.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, true)
                                  })).filter(el => el.updates.length > 0);

                                  const futureStandards = standards.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, true)
                                  })).filter(el => el.updates.length > 0);

                                  const futureMarkings = markings.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, true)
                                  })).filter(el => el.updates.length > 0);

                                  // Previous updates - sorted descending (newest first)
                                  const previousLegislation = legislation.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, false).sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateB.localeCompare(dateA); // Descending
                                    })
                                  })).filter(el => el.updates.length > 0);

                                  const previousStandards = standards.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, false).sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateB.localeCompare(dateA); // Descending
                                    })
                                  })).filter(el => el.updates.length > 0);

                                  const previousMarkings = markings.map(el => ({
                                    name: el.name,
                                    updates: filterUpdatesByDate(el.updates, false).sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateB.localeCompare(dateA); // Descending
                                    })
                                  })).filter(el => el.updates.length > 0);

                                  const futureCount = futureLegislation.reduce((sum, el) => sum + el.updates.length, 0) +
                                                     futureStandards.reduce((sum, el) => sum + el.updates.length, 0) +
                                                     futureMarkings.reduce((sum, el) => sum + el.updates.length, 0);

                                  const previousCount = previousLegislation.reduce((sum, el) => sum + el.updates.length, 0) +
                                                       previousStandards.reduce((sum, el) => sum + el.updates.length, 0) +
                                                       previousMarkings.reduce((sum, el) => sum + el.updates.length, 0);

                                  return (
                                    <Tabs defaultValue="future" className="w-full">
                                      <TabsList className="bg-gray-100 mb-6 h-11 gap-1">
                                        <TabsTrigger value="future" className="data-[state=active]:bg-white px-6">
                                          <span className="font-semibold">Future</span>
                                          <span className="ml-2 text-xs text-gray-500">({futureCount})</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="previous" className="data-[state=active]:bg-white px-6">
                                          <span className="font-semibold">Previous</span>
                                          <span className="ml-2 text-xs text-gray-500">({previousCount})</span>
                                        </TabsTrigger>
                                      </TabsList>
                                      
                                      <TabsContent value="future">
                                        {futureCount > 0 ? (
                                          renderColumns(futureLegislation, futureStandards, futureMarkings)
                                        ) : (
                                          <div className="text-center py-8 text-gray-500 text-sm">
                                            No future updates available
                                          </div>
                                        )}
                                      </TabsContent>
                                      
                                      <TabsContent value="previous">
                                        {previousCount > 0 ? (
                                          renderColumns(previousLegislation, previousStandards, previousMarkings)
                                        ) : (
                                          <div className="text-center py-8 text-gray-500 text-sm">
                                            No previous updates available
                                          </div>
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  );
                                })()
                              ) : (
                                <div className="bg-dashboard-view-background p-4 max-h-96 overflow-y-auto">
                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                                    {product.step4Results.raw_response || JSON.stringify(product.step4Results, null, 2) || 'No data available'}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="mt-4 text-xs text-gray-400">
                        Created: {new Date(product.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Action Buttons - Top Right Corner */}
                    <div className="flex gap-2 flex-shrink-0 items-start">
                      {(() => {
                        // Determine which step should be started next
                        let nextStep: number | null = null;
                        
                        if (product.step0Status === 'pending' || !product.step0Status) {
                          nextStep = 0;
                        } else if (product.step0Status === 'completed' && (product.step1Status === 'pending' || !product.step1Status)) {
                          nextStep = 1;
                        } else if (product.step1Status === 'completed' && (product.step2Status === 'pending' || !product.step2Status)) {
                          nextStep = 2;
                        } else if (product.step2Status === 'completed' && (product.step3Status === 'pending' || !product.step3Status)) {
                          nextStep = 3;
                        } else if (product.step3Status === 'completed' && (product.step4Status === 'pending' || !product.step4Status)) {
                          nextStep = 4;
                        }
                        
                        return nextStep !== null ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                              if (nextStep === 0) handleStartStep0(product.id);
                              else if (nextStep === 1) handleStartStep1(product.id);
                              else if (nextStep === 2) handleStartStep2(product.id);
                              else if (nextStep === 3) handleStartStep3(product.id);
                              else if (nextStep === 4) handleStartStep4(product.id);
                          }}
                          className="border-0 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Next
                        </Button>
                        ) : null;
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
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

