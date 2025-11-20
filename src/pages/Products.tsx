import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronRight, Play, ChevronDown, ChevronUp, Package, AlertTriangle, CheckCircle2, FileCheck, RefreshCw } from 'lucide-react';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
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
  components: Component[];
  summary: string;
  processingTime: string;
  aiModel: string;
}

interface ComponentAssessment {
  componentId: string;
  componentName: string;
  complianceRequirements: string[];
  riskLevel: string;
  testingRequired: string[];
}

interface Step1Results {
  assessments: ComponentAssessment[];
  summary: string;
  processingTime: string;
  aiModel: string;
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
  complianceElements: ComplianceElement[];
  summary: string;
  processingTime: string;
  aiModel: string;
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
  createdAt: string;
  step0Results?: Step0Results;
  step1Results?: Step1Results;
  step2Results?: Step2Results;
  components?: Component[];
  step0Progress?: {
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
  const [expandedStep0, setExpandedStep0] = useState<string | null>(null);
  const [expandedStep1, setExpandedStep1] = useState<string | null>(null);
  const [expandedStep2, setExpandedStep2] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: '',
    productName: ''
  });

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

  const handleProductAdded = () => {
    setShowAddDialog(false);
    fetchProducts(); // Refresh the list
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

  const handleRefreshStep = async (productId: string, step: 0 | 1 | 2) => {
    try {
      console.log(`Refreshing Step ${step} for product:`, productId);
      if (step === 0) {
        await handleStartStep0(productId);
      } else if (step === 1) {
        await handleStartStep1(productId);
      } else if (step === 2) {
        await handleStartStep2(productId);
      }
    } catch (error) {
      console.error(`Failed to refresh Step ${step}:`, error);
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-200 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      complete: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-200 text-gray-700'} border-0`}>
        {status === 'running' || status === 'processing' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : null}
        {status}
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
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {product.description}
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

                      {/* Pipeline Status */}
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        {/* Step 0 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Step 0:</span>
                            {getStatusBadge(product.step0Status)}
                            {(product.step0Status === 'completed' || product.step0Status === 'error') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshStep(product.id, 0)}
                                className="h-6 px-2 text-xs text-gray-500 hover:text-[hsl(var(--dashboard-link-color))]"
                                title="Re-run Step 0"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            {/* Real-time progress display */}
                            {product.step0Status === 'running' && product.step0Progress && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">{product.step0Progress.current}</span>
                                <span className="text-xs text-gray-400">({product.step0Progress.percentage}%)</span>
                              </div>
                            )}
                            {product.step0Status === 'completed' && product.step0Results && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedStep0(expandedStep0 === product.id ? null : product.id)}
                                className="h-6 px-2 text-xs text-[hsl(var(--dashboard-link-color))]"
                              >
                                {expandedStep0 === product.id ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Hide Results
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show Results
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {/* Expandable Step 0 Results */}
                          {expandedStep0 === product.id && product.step0Results && (
                            <div className="ml-6 mt-2">
                              {/* REAL Step 0 Results - Full Product Decomposition */}
                              {product.step0Results.product_decomposition ? (
                                <div>
                                  <div className="mb-3">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                      Product Decomposition - Technical Specification
                                    </h5>
                                  </div>
                                  <div className="bg-dashboard-view-background p-4 max-h-96 overflow-y-auto">
                                    <div className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                      {product.step0Results.product_decomposition}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* FALLBACK: Old fake format (for backwards compatibility) */
                                <div>
                                  <div className="mb-3">
                                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                      Product Decomposition Results
                                    </h5>
                                    <p className="text-xs text-gray-600 mb-3">
                                      {product.step0Results.summary}
                                    </p>
                                    <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                      <span>Processing time: {product.step0Results.processingTime}</span>
                                      <span>Model: {product.step0Results.aiModel}</span>
                                      <span>{product.step0Results.components?.length || 0} components</span>
                                    </div>
                                  </div>

                                  {product.step0Results.components && (
                                    <div className="space-y-2">
                                      {product.step0Results.components.map((component: any) => (
                                        <div
                                          key={component.id}
                                          className="bg-dashboard-view-background p-3"
                                        >
                                          <div className="flex items-start gap-2">
                                            <Package className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                              <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                                {component.name}
                                              </h6>
                                              <p className="text-xs text-gray-600 mb-2">
                                                {component.description}
                                              </p>
                                              <div className="text-xs mb-2">
                                                <span className="text-gray-500">Function:</span>
                                                <span className="ml-1 text-[hsl(var(--dashboard-link-color))]">
                                                  {component.function}
                                                </span>
                                              </div>
                                              {component.materials && (
                                                <div className="flex flex-wrap gap-1">
                                                  {component.materials.map((material: string, idx: number) => (
                                                    <Badge
                                                      key={idx}
                                                      className="bg-gray-100 text-gray-700 text-xs border-0"
                                                    >
                                                      {material}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step 1 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-500">Step 1:</span>
                            {getStatusBadge(product.step1Status)}
                            {(product.step1Status === 'completed' || product.step1Status === 'error') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshStep(product.id, 1)}
                                className="h-6 px-2 text-xs text-gray-500 hover:text-[hsl(var(--dashboard-link-color))]"
                                title="Re-run Step 1"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            {product.step1Status === 'completed' && product.step1Results && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedStep1(expandedStep1 === product.id ? null : product.id)}
                                className="h-6 px-2 text-xs text-[hsl(var(--dashboard-link-color))]"
                              >
                                {expandedStep1 === product.id ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Hide Results
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show Results
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Expandable Step 1 Results */}
                          {expandedStep1 === product.id && product.step1Results && (
                            <div className="ml-6 mt-2">
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Assessment Results
                                </h5>
                                <p className="text-xs text-gray-600 mb-3">
                                  {product.step1Results.summary}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                  <span>Processing time: {product.step1Results.processingTime}</span>
                                  <span>Model: {product.step1Results.aiModel}</span>
                                  <span>{product.step1Results.assessments.length} assessments</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {product.step1Results.assessments.map((assessment) => (
                                  <div
                                    key={assessment.componentId}
                                    className="bg-dashboard-view-background p-3"
                                  >
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                          {assessment.componentName}
                                        </h6>
                                        <div className="text-xs mb-2">
                                          <span className="text-gray-500">Risk Level:</span>
                                          <Badge className={`ml-2 text-xs border-0 ${
                                            assessment.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                            assessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                          }`}>
                                            {assessment.riskLevel}
                                          </Badge>
                                        </div>
                                        <div className="text-xs mb-2">
                                          <span className="text-gray-500">Requirements:</span>
                                          <div className="mt-1 space-y-1">
                                            {assessment.complianceRequirements.map((req, idx) => (
                                              <div key={idx} className="text-[hsl(var(--dashboard-link-color))]">
                                                • {req}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {assessment.testingRequired.length > 0 && (
                                          <div className="text-xs">
                                            <span className="text-gray-500">Testing Required:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {assessment.testingRequired.map((test, idx) => (
                                                <Badge
                                                  key={idx}
                                                  className="bg-blue-50 text-blue-700 text-xs border-0"
                                                >
                                                  {test}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Step 2 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-500">Step 2:</span>
                            {getStatusBadge(product.step2Status)}
                            {(product.step2Status === 'completed' || product.step2Status === 'error') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshStep(product.id, 2)}
                                className="h-6 px-2 text-xs text-gray-500 hover:text-[hsl(var(--dashboard-link-color))]"
                                title="Re-run Step 2"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            {product.step2Status === 'completed' && product.step2Results && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedStep2(expandedStep2 === product.id ? null : product.id)}
                                className="h-6 px-2 text-xs text-[hsl(var(--dashboard-link-color))]"
                              >
                                {expandedStep2 === product.id ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Hide Results
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show Results
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Expandable Step 2 Results */}
                          {expandedStep2 === product.id && product.step2Results && (
                            <div className="ml-6 mt-2">
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                                  Compliance Elements Identified
                                </h5>
                                <p className="text-xs text-gray-600 mb-3">
                                  {product.step2Results.summary}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                  <span>Processing time: {product.step2Results.processingTime}</span>
                                  <span>Model: {product.step2Results.aiModel}</span>
                                  <span>{product.step2Results.complianceElements.length} elements</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {product.step2Results.complianceElements.map((element) => (
                                  <div
                                    key={element.id}
                                    className="bg-dashboard-view-background p-3"
                                  >
                                    <div className="flex items-start gap-2">
                                      <FileCheck className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h6 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))]">
                                            {element.name}
                                          </h6>
                                          {element.isMandatory && (
                                            <Badge className="bg-red-50 text-red-700 text-xs border-0">
                                              Mandatory
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs mb-2">
                                          <Badge className="bg-gray-100 text-gray-700 text-xs border-0">
                                            {element.type}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">
                                          {element.applicability}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {element.markets.map((market, idx) => (
                                            <Badge
                                              key={idx}
                                              className="bg-blue-50 text-blue-700 text-xs border-0"
                                            >
                                              {market}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-400">
                        Created: {new Date(product.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(product.step0Status === 'pending' || product.step1Status === 'pending' || product.step2Status === 'pending') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (product.step0Status === 'pending') handleStartStep0(product.id);
                            else if (product.step1Status === 'pending') handleStartStep1(product.id);
                            else if (product.step2Status === 'pending') handleStartStep2(product.id);
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

