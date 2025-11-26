import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Play, 
  FileCheck, 
  XCircle, 
  Eye, 
  EyeOff, 
  MoreVertical,
  Edit,
  Copy,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: any;
  expandedStep: { productId: string; stepNumber: number } | null;
  executingSteps: Set<string>;
  onToggleStep: (productId: string, stepNumber: number) => void;
  onExecuteStep: (productId: string, stepNumber: number) => void;
  onEdit: (productId: string) => void;
  onDuplicate: (product: any) => void;
  onDelete: (productId: string, productName: string) => void;
  renderStepContent: (product: any, stepNumber: number) => React.ReactNode;
}

// Memoized to prevent unnecessary re-renders
export const ProductCard = memo(function ProductCard({
  product,
  expandedStep,
  executingSteps,
  onToggleStep,
  onExecuteStep,
  onEdit,
  onDuplicate,
  onDelete,
  renderStepContent
}: ProductCardProps) {
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
  
  const isExecutingStep0 = executingSteps.has(`${product.id}-step0`);
  const isExecutingStep1 = executingSteps.has(`${product.id}-step1`);
  const isExecutingStep2 = executingSteps.has(`${product.id}-step2`);
  const isExecutingStep3 = executingSteps.has(`${product.id}-step3`);
  const isExecutingStep4 = executingSteps.has(`${product.id}-step4`);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') {
      return <Badge className="bg-green-50 text-green-700 border-0"><FileCheck className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    if (statusLower === 'running') {
      return <Badge className="bg-blue-50 text-blue-700 border-0"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
    }
    if (statusLower === 'error') {
      return <Badge className="bg-red-50 text-red-700 border-0"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
    }
    if (statusLower === 'pending') {
      return <Badge className="bg-gray-100 text-gray-700 border-0">Pending</Badge>;
    }
    return <Badge className="border-0">{status}</Badge>;
  };

  const canExecuteStep = (stepNumber: number) => {
    if (stepNumber === 0) return step0StatusLower === 'pending' || step0StatusLower === 'error';
    if (stepNumber === 1) return step0StatusLower === 'completed' && (step1StatusLower === 'pending' || step1StatusLower === 'error');
    if (stepNumber === 2) return step1StatusLower === 'completed' && (step2StatusLower === 'pending' || step2StatusLower === 'error');
    if (stepNumber === 3) return step2StatusLower === 'completed' && (step3StatusLower === 'pending' || step3StatusLower === 'error');
    if (stepNumber === 4) return step3StatusLower === 'completed' && (step4StatusLower === 'pending' || step4StatusLower === 'error');
    return false;
  };

  const steps = [
    { number: 0, title: 'Product Decomposition', status: step0Status, statusLower: step0StatusLower, isExecuting: isExecutingStep0 },
    { number: 1, title: 'Compliance Assessment', status: step1Status, statusLower: step1StatusLower, isExecuting: isExecutingStep1 },
    { number: 2, title: 'Identify Compliance Elements', status: step2Status, statusLower: step2StatusLower, isExecuting: isExecutingStep2 },
    { number: 3, title: 'Generate Compliance Descriptions', status: step3Status, statusLower: step3StatusLower, isExecuting: isExecutingStep3 },
    { number: 4, title: 'Track Compliance Updates', status: step4Status, statusLower: step4StatusLower, isExecuting: isExecutingStep4 },
  ];

  return (
    <Card className="bg-white border-0">
      <CardContent className="p-4 md:p-6">
        {/* Product Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-[hsl(var(--dashboard-link-color))] mb-1">{product.name}</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-2">{product.description}</p>
            <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-500">
              <span>Type: {product.type ? product.type.charAt(0).toUpperCase() + product.type.slice(1) : ''}</span>
              {product.markets && product.markets.length > 0 && (
                <span>Markets: {product.markets.join(', ')}</span>
              )}
            </div>
          </div>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-0 bg-gray-50 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-0">
              <DropdownMenuItem onClick={() => onEdit(product.id)} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(product)} className="cursor-pointer">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(product.id, product.name)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => {
            const isExpanded = expandedStep?.productId === product.id && expandedStep?.stepNumber === step.number;
            const canExecute = canExecuteStep(step.number);
            
            return (
              <div key={step.number} className="border border-gray-200">
                {/* Step Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => onToggleStep(product.id, step.number)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs md:text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                      Step {step.number}: {step.title}
                    </span>
                    {getStatusBadge(step.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {canExecute && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExecuteStep(product.id, step.number);
                        }}
                        disabled={step.isExecuting}
                        className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white text-xs"
                      >
                        {step.isExecuting ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Run
                          </>
                        )}
                      </Button>
                    )}
                    {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                </div>

                {/* Step Content (only render when expanded) */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    {renderStepContent(product, step.number)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  // Only re-render if these props actually changed
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.step0Status === nextProps.product.step0Status &&
    prevProps.product.step1Status === nextProps.product.step1Status &&
    prevProps.product.step2Status === nextProps.product.step2Status &&
    prevProps.product.step3Status === nextProps.product.step3Status &&
    prevProps.product.step4Status === nextProps.product.step4Status &&
    prevProps.expandedStep === nextProps.expandedStep &&
    prevProps.executingSteps === nextProps.executingSteps
  );
});

