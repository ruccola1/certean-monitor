import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Play, AlertTriangle, FileCheck, RefreshCw, XCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
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
  // Legacy
  components?: Component[];
  summary?: string;
  processingTime?: string;
  aiModel?: string;
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

interface Product {
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
  step1Results?: Step1Results;
  step2Results?: Step2Results;
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  // Single state to track which step is expanded (only one at a time)
  const [expandedStep, setExpandedStep] = useState<{ productId: string; stepNumber: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: '',
    productName: ''
  });
  
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

      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch products immediately when component mounts
    fetchProducts();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);
    
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);
  
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
        { num: 0, current: product.step0Status, previous: previousStatuses.step0, name: 'Technical Decomposition' },
        { num: 1, current: product.step1Status, previous: previousStatuses.step1, name: 'Compliance Assessment' },
        { num: 2, current: product.step2Status, previous: previousStatuses.step2, name: 'Identify Elements' },
        { num: 3, current: product.step3Status, previous: previousStatuses.step3, name: 'Compliance Descriptions' },
        { num: 4, current: product.step4Status, previous: previousStatuses.step4, name: 'Track Updates' },
      ];
      
      steps.forEach(step => {
        // Detect completed steps
        if (step.previous === 'running' && step.current === 'completed') {
          addNotification({
            type: 'success',
            title: `Step ${step.num} Completed`,
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
            title: `Step ${step.num} Failed`,
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
    fetchProducts(); // Refresh the list
  };

  const handleDiscardSource = async (productId: string, sourceIndex: number) => {
    try {
      // Update the product to mark the source as discarded
      await apiService.getInstance().patch(`/api/products/${productId}/discard-source`, {
        sourceIndex
      });
      console.log('Source discarded for product:', productId, 'index:', sourceIndex);
      fetchProducts();
    } catch (error) {
      console.error('Failed to discard source:', error);
    }
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

  const handleStartStep0 = async (productId: string) => {
    try {
      console.log('🚀 Starting Step 0 for product:', productId);
      const response = await productService.runStep0(productId);
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
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step2`);
      console.log('Step 2 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 2:', error);
    }
  };

  const handleStartStep3 = async (productId: string) => {
    try {
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step3`);
      console.log('Step 3 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 3:', error);
    }
  };

  const handleStartStep4 = async (productId: string) => {
    try {
      const response = await apiService.getInstance().post(`/api/products/${productId}/execute-step4`);
      console.log('Step 4 started for product:', productId, response.data);
      fetchProducts();
    } catch (error) {
      console.error('Failed to start Step 4:', error);
    }
  };

  const handleRefreshStep = async (productId: string, step: 0 | 1 | 2 | 3 | 4) => {
    try {
      console.log(`Refreshing Step ${step} for product:`, productId);
      if (step === 0) {
        await handleStartStep0(productId);
      } else if (step === 1) {
        await handleStartStep1(productId);
      } else if (step === 2) {
        await handleStartStep2(productId);
      } else if (step === 3) {
        await handleStartStep3(productId);
      } else if (step === 4) {
        await handleStartStep4(productId);
      }
    } catch (error) {
      console.error(`Failed to refresh Step ${step}:`, error);
    }
  };

  const handleStopStep = async (productId: string, step: 0 | 1 | 2 | 3 | 4) => {
    try {
      console.log(`Stopping Step ${step} for product:`, productId);
      await productService.stopStep(productId, step);
      console.log(`Step ${step} stopped successfully`);
      fetchProducts();
    } catch (error) {
      console.error(`Failed to stop Step ${step}:`, error);
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
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
              Products
            </h1>
            <p className="text-[15px] text-gray-500 mt-2">
              Manage your products and their compliance status
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
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
            {products.map((product) => (
              <Card key={product.id} className="bg-white border-0">
                <CardContent className="p-6">
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

                      <div className="flex items-center gap-6 text-sm">
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

                      {/* Pipeline Status - Horizontal Step Boxes */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* Step Boxes - Horizontal Layout - All 5 steps (1 & 3 are status-only markers) */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {/* Step 0 Box - Product Details */}
                          <button
                            onClick={() => {
                              if (expandedStep?.productId === product.id && expandedStep?.stepNumber === 0) {
                                setExpandedStep(null);
                              } else {
                                setExpandedStep({ productId: product.id, stepNumber: 0 });
                              }
                            }}
                            className={`border-0 p-4 transition-colors text-left relative ${
                              expandedStep?.productId === product.id && expandedStep?.stepNumber === 0
                                ? 'bg-gray-200'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-semibold text-gray-700 mb-2">Product Details</span>
                              {getStatusBadge(product.step0Status)}
                              {(product.step0Status === 'running' || product.step0Status === 'processing') && (
                                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--dashboard-link-color))] mt-1" />
                              )}
                            </div>
                            {(product.step0Status === 'completed' || product.step0Status === 'error') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefreshStep(product.id, 0);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Re-run Product Details"
                                >
                                  <RefreshCw className="w-3 h-3 text-gray-500" />
                                </Button>
                              </div>
                            )}
                            {(product.step0Status === 'running' || product.step0Status === 'processing') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopStep(product.id, 0);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Stop Product Details"
                                >
                                  <XCircle className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </button>

                          {/* Step 1 Marker - Research Sources (Status Only) */}
                          <div className="border-0 p-4 bg-gray-100">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-semibold text-gray-500 mb-2">Research Sources</span>
                              {getStatusBadge(product.step1Status)}
                              {(product.step1Status === 'running' || product.step1Status === 'processing') && (
                                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--dashboard-link-color))] mt-1" />
                              )}
                            </div>
                          </div>

                          {/* Step 2 Box - Compliance Elements */}
                          <button
                            onClick={() => {
                              if (expandedStep?.productId === product.id && expandedStep?.stepNumber === 2) {
                                setExpandedStep(null);
                              } else {
                                setExpandedStep({ productId: product.id, stepNumber: 2 });
                              }
                            }}
                            className={`border-0 p-4 transition-colors text-left relative ${
                              expandedStep?.productId === product.id && expandedStep?.stepNumber === 2
                                ? 'bg-gray-200'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-semibold text-gray-700 mb-2">Compliance Elements</span>
                              {getStatusBadge(product.step2Status)}
                              {(product.step2Status === 'running' || product.step2Status === 'processing') && (
                                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--dashboard-link-color))] mt-1" />
                              )}
                            </div>
                            {(product.step2Status === 'completed' || product.step2Status === 'error') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefreshStep(product.id, 2);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Re-run Compliance Elements"
                                >
                                  <RefreshCw className="w-3 h-3 text-gray-500" />
                                </Button>
                              </div>
                            )}
                            {(product.step2Status === 'running' || product.step2Status === 'processing') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopStep(product.id, 2);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Stop Compliance Elements"
                                >
                                  <XCircle className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </button>

                          {/* Step 3 Marker - Element Mapping (Status Only) */}
                          <div className="border-0 p-4 bg-gray-100">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-semibold text-gray-500 mb-2">Element Mapping</span>
                              {getStatusBadge(product.step3Status)}
                              {(product.step3Status === 'running' || product.step3Status === 'processing') && (
                                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--dashboard-link-color))] mt-1" />
                              )}
                            </div>
                          </div>

                          {/* Step 4 Box - Compliance Updates */}
                          <button
                            onClick={() => {
                              if (expandedStep?.productId === product.id && expandedStep?.stepNumber === 4) {
                                setExpandedStep(null);
                              } else {
                                setExpandedStep({ productId: product.id, stepNumber: 4 });
                              }
                            }}
                            className={`border-0 p-4 transition-colors text-left relative ${
                              expandedStep?.productId === product.id && expandedStep?.stepNumber === 4
                                ? 'bg-gray-200'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-semibold text-gray-700 mb-2">Compliance Updates</span>
                              {getStatusBadge(product.step4Status)}
                              {(product.step4Status === 'running' || product.step4Status === 'processing') && (
                                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--dashboard-link-color))] mt-1" />
                              )}
                            </div>
                            {(product.step4Status === 'completed' || product.step4Status === 'error') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefreshStep(product.id, 4);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Re-run Compliance Updates"
                                >
                                  <RefreshCw className="w-3 h-3 text-gray-500" />
                                </Button>
                              </div>
                            )}
                            {(product.step4Status === 'running' || product.step4Status === 'processing') && (
                              <div className="absolute top-1 right-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopStep(product.id, 4);
                                  }}
                                  className="h-5 w-5 p-0"
                                  title="Stop Compliance Updates"
                                >
                                  <XCircle className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </button>
                        </div>
                          
                          {/* Expandable Step 0 Results */}
                          {expandedStep?.productId === product.id && expandedStep?.stepNumber === 0 && product.step0Results && (
                            <div className="ml-6 mt-2 space-y-4">
                              {/* Categories and Materials at the TOP */}
                              <div className="space-y-3">
                                {/* Categories - First */}
                                {product.step0Results.categories && product.step0Results.categories.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-600 mb-2">Categories</h6>
                                    <div className="flex flex-wrap gap-2">
                                      {product.step0Results.categories.map((category: string, idx: number) => (
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
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Materials - Second */}
                                {product.step0Results.materials && product.step0Results.materials.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-600 mb-2">Materials</h6>
                                    <div className="flex flex-wrap gap-2">
                                      {product.step0Results.materials.map((material: string, idx: number) => (
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
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Product Overview */}
                              <div>
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                  Product Overview
                                </h5>
                                <div className="bg-dashboard-view-background p-4">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {product.step0Results.product_overview || product.description}
                                  </p>
                                </div>
                              </div>

                              {/* Components */}
                              {product.components && product.components.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                    Components ({product.components.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {product.components.map((component: any, idx: number) => (
                                      <div key={idx} className="bg-dashboard-view-background p-4">
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
                                        
                                        {/* Technical Specifications Table */}
                                        {component.technical_specifications && (
                                          <div className="mt-3">
                                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Technical Specifications</h6>
                                            <div className="bg-white border-0">
                                              <table className="w-full text-xs">
                                                <tbody>
                                                  {Object.entries(component.technical_specifications).map(([key, value], specIdx) => (
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
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Research Sources */}
                              {product.step0Results.research_sources && product.step0Results.research_sources > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                    Research Sources ({product.step0Results.research_sources})
                                  </h5>
                                  <div className="bg-dashboard-view-background p-4 space-y-2">
                                    <p className="text-xs text-gray-600">
                                      {product.step0Results.research_sources} sources used. Sources can be managed in Step 1.
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Fallback: Show raw text if no components */}
                              {/* Always show full product decomposition if available */}
                              {(product.step0Results?.product_decomposition || product.step0Payload?.product_decomposition) && (
                                <div>
                                  <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                    Complete Technical Product Decomposition
                                  </h5>
                                  <div className="bg-dashboard-view-background p-4 max-h-[600px] overflow-y-auto">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                      {product.step0Results?.product_decomposition || product.step0Payload?.product_decomposition}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Step 1 - Shown as status marker only, not expandable */}

                        {/* Expandable Step 2 Results */}
                          {expandedStep?.productId === product.id && expandedStep?.stepNumber === 2 && product.step2Results && (
                            <div className="ml-6 mt-2">
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Elements ({product.step2Results.elements_count || 0})
                                </h5>
                              </div>
                              
                              {/* Display as structured list if we have parsed elements */}
                              {product.step2Results.compliance_elements && Array.isArray(product.step2Results.compliance_elements) && product.step2Results.compliance_elements.length > 0 ? (
                                (() => {
                                  // Group elements by normalized type
                                  const grouped = product.step2Results.compliance_elements.reduce((acc: any, element: any) => {
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
                                      <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                        {title} ({grouped[category]?.length || 0})
                                      </h6>
                                      <div className="space-y-2">
                                        {grouped[category]?.map((element: any, idx: number) => {
                                          const name = element?.element_name || element?.name || 'Unnamed';
                                          const designation = element?.element_designation || element?.designation || '';
                                          const description = element?.element_description_long || element?.description || '';
                                          const countries = element?.element_countries || element?.countries || [];
                                          
                                          const elementUrl = element?.element_url || element?.url;
                                          
                                          return (
                                            <div key={idx} className="bg-dashboard-view-background p-3">
                                              <div className="flex items-start gap-2">
                                                <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                                      {name}
                                                    </h6>
                                                    {elementUrl && (
                                                      <a 
                                                        href={elementUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[hsl(var(--dashboard-link-color))] hover:text-[hsl(var(--dashboard-link-color))]/80"
                                                        title="View compliance element details"
                                                      >
                                                        <ExternalLink className="w-3 h-3" />
                                                      </a>
                                                    )}
                                                  </div>
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
                                    <div className="grid grid-cols-3 gap-4">
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

                        {/* Step 3 - Shown as status marker only, not expandable */}

                        {/* Expandable Step 4 Results */}
                          {expandedStep?.productId === product.id && expandedStep?.stepNumber === 4 && product.step4Results && (
                            <div className="ml-6 mt-2">
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

                                  // Sort updates within each element by date descending
                                  Object.keys(updatesByElement).forEach(key => {
                                    updatesByElement[key].sort((a: any, b: any) => {
                                      const dateA = a?.update_date || a?.date || '';
                                      const dateB = b?.update_date || b?.date || '';
                                      return dateB.localeCompare(dateA); // Descending
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

                                  return (
                                    <div className="grid grid-cols-3 gap-4">
                                      {/* Legislation Column */}
                                      <div>
                                        <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                          Legislation ({legislation.length})
                                        </h6>
                                        <div className="space-y-3">
                                          {legislation.map((element, elIdx) => (
                                            <div key={elIdx} className="bg-white border-0 p-3">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-2">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateType = update?.type || 'Update';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const validity = update?.validity || '';
                                                  
                                                  return (
                                                    <div key={idx} className="bg-dashboard-view-background p-2 border-l-2 border-blue-500">
                                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        {impact && (
                                                          <Badge className={`text-xs border-0 ${
                                                            impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                            impact.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                          }`}>
                                                            {impact}
                                                          </Badge>
                                                        )}
                                                        {updateDate && (
                                                          <span className="text-xs text-gray-500">{updateDate}</span>
                                                        )}
                                                      </div>
                                                      <p className="text-xs font-semibold text-[hsl(var(--dashboard-link-color))] mb-1">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                      {description && (
                                                        <p className="text-xs text-gray-600">
                                                          {String(description).substring(0, 150)}{String(description).length > 150 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Standards Column */}
                                      <div>
                                        <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                          Standards ({standards.length})
                                        </h6>
                                        <div className="space-y-3">
                                          {standards.map((element, elIdx) => (
                                            <div key={elIdx} className="bg-white border-0 p-3">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-2">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateType = update?.type || 'Update';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const validity = update?.validity || '';
                                                  
                                                  return (
                                                    <div key={idx} className="bg-dashboard-view-background p-2 border-l-2 border-blue-500">
                                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        {impact && (
                                                          <Badge className={`text-xs border-0 ${
                                                            impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                            impact.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                          }`}>
                                                            {impact}
                                                          </Badge>
                                                        )}
                                                        {updateDate && (
                                                          <span className="text-xs text-gray-500">{updateDate}</span>
                                                        )}
                                                      </div>
                                                      <p className="text-xs font-semibold text-[hsl(var(--dashboard-link-color))] mb-1">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                      {description && (
                                                        <p className="text-xs text-gray-600">
                                                          {String(description).substring(0, 150)}{String(description).length > 150 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Markings Column */}
                                      <div>
                                        <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                          Markings ({markings.length})
                                        </h6>
                                        <div className="space-y-3">
                                          {markings.map((element, elIdx) => (
                                            <div key={elIdx} className="bg-white border-0 p-3">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
                                                {element.name}
                                              </h6>
                                              <div className="space-y-2">
                                                {element.updates.map((update: any, idx: number) => {
                                                  const title = update?.title || '';
                                                  const updateType = update?.type || 'Update';
                                                  const updateDate = update?.update_date || update?.date || '';
                                                  const description = update?.description || update?.update || '';
                                                  const impact = update?.impact || '';
                                                  const validity = update?.validity || '';
                                                  
                                                  return (
                                                    <div key={idx} className="bg-dashboard-view-background p-2 border-l-2 border-blue-500">
                                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        {impact && (
                                                          <Badge className={`text-xs border-0 ${
                                                            impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                            impact.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                          }`}>
                                                            {impact}
                                                          </Badge>
                                                        )}
                                                        {updateDate && (
                                                          <span className="text-xs text-gray-500">{updateDate}</span>
                                                        )}
                                                      </div>
                                                      <p className="text-xs font-semibold text-[hsl(var(--dashboard-link-color))] mb-1">
                                                        {title || description.slice(0, 80) + (description.length > 80 ? '...' : '')}
                                                      </p>
                                                      {description && (
                                                        <p className="text-xs text-gray-600">
                                                          {String(description).substring(0, 150)}{String(description).length > 150 ? '...' : ''}
                                                        </p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
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

                    <div className="flex gap-2">
                      {(
                        product.step0Status === 'pending' || !product.step0Status || 
                        product.step1Status === 'pending' || !product.step1Status || 
                        product.step2Status === 'pending' || !product.step2Status || 
                        product.step3Status === 'pending' || !product.step3Status || 
                        product.step4Status === 'pending' || !product.step4Status
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (product.step0Status === 'pending' || !product.step0Status) handleStartStep0(product.id);
                            else if (product.step1Status === 'pending' || !product.step1Status) handleStartStep1(product.id);
                            else if (product.step2Status === 'pending' || !product.step2Status) handleStartStep2(product.id);
                            else if (product.step3Status === 'pending' || !product.step3Status) handleStartStep3(product.id);
                            else if (product.step4Status === 'pending' || !product.step4Status) handleStartStep4(product.id);
                          }}
                          className="border-0 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Next
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(product.id, product.name)}
                        className="border-0 bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onProductAdded={handleProductAdded}
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

