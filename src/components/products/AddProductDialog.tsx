import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
import { AlertCircle, X, Plus } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
  initialProduct?: {
    name?: string;
    description?: string;
    type?: 'existing' | 'future' | 'imaginary';
    urls?: string[];
    markets?: string[];
    uploaded_files?: string[];
    uploaded_images?: string[];
  };
}

export function AddProductDialog({ open, onOpenChange, onProductAdded, initialProduct }: AddProductDialogProps) {
  const { user } = useAuth0();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'existing' | 'new'>('existing');
  const [urls, setUrls] = useState('');
  const [markets, setMarkets] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Component definition state
  const [defineComponents, setDefineComponents] = useState(false);
  const [components, setComponents] = useState<Array<{ title: string; description: string }>>([
    { title: '', description: '' }
  ]);

  // Pre-fill form when initialProduct is provided or dialog opens
  useEffect(() => {
    if (initialProduct && open) {
      // Extract name and description (description might be "name: description" format)
      const fullDescription = initialProduct.description || '';
      const namePrefix = initialProduct.name ? `${initialProduct.name}: ` : '';
      
      // If description starts with "name: ", remove it
      let cleanDescription = fullDescription;
      if (namePrefix && fullDescription.startsWith(namePrefix)) {
        cleanDescription = fullDescription.substring(namePrefix.length);
      }
      
      setName(initialProduct.name || '');
      setDescription(cleanDescription);
      
      // Map type: 'future' -> 'new', 'imaginary' -> 'existing', 'existing' -> 'existing'
      if (initialProduct.type === 'future') {
        setType('new');
      } else {
        setType('existing');
      }
      
      // Join arrays with commas
      setUrls(initialProduct.urls?.join(', ') || '');
      setMarkets(initialProduct.markets?.join(', ') || '');
      
      // Note: We can't re-upload files/images, so we leave those empty
      // User can add new files if needed
    } else if (!initialProduct && open) {
      // Reset form when opening without initial product
      setName('');
      setDescription('');
      setType('existing');
      setUrls('');
      setMarkets('');
      setUploadedFiles([]);
      setUploadedImages([]);
      setDefineComponents(false);
      setComponents([{ title: '', description: '' }]);
    }
  }, [initialProduct, open]);

  // Reset error when dialog closes
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  // Component management functions
  const addComponentRow = () => {
    setComponents([...components, { title: '', description: '' }]);
  };

  const removeComponentRow = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateComponent = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use Certean AI API key for backend authentication
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
        console.log('API key set for authentication');
      } else {
        console.warn('VITE_CERTEAN_API_KEY not found in environment variables');
      }

      // Concatenate name with description (matching certean-ai frontend)
      const fullDescription = `${name}: ${description}`;

      // Filter out empty components
      const validComponents = defineComponents 
        ? components.filter(c => c.title.trim() && c.description.trim())
        : [];

      const productData = {
        products: [
          {
            name,
            description: fullDescription,
            type: (type === 'new' ? 'future' : type) as 'existing' | 'future' | 'imaginary', // Map 'new' to 'future' to match Product type
            urls: urls.split(',').map(url => url.trim()).filter(url => url),
            markets: markets.split(',').map(market => market.trim().toUpperCase()).filter(market => market),
            uploaded_files: uploadedFiles.map(f => f.name),
            uploaded_images: uploadedImages.map(f => f.name),
            predefined_components: validComponents.length > 0 ? validComponents : undefined,
          }
        ]
      };

      console.log('Adding product:', productData);
      
      // Extract client_id (company ID) from Auth0 user metadata
      const clientId = getClientId(user);
      
      // Call API to add product with client_id
      const response = await productService.createBulk(productData.products, clientId);
      
      console.log('Product created successfully:', response);

      // Step 0 is now auto-triggered by the backend upon creation
      
      // Reset form
      setName('');
      setDescription('');
      setType('existing');
      setUrls('');
      setMarkets('');
      setUploadedFiles([]);
      setUploadedImages([]);

      // Close dialog and notify parent FIRST
      onOpenChange(false);
      
      // Notify parent component with a slight delay to ensure product is saved
      if (onProductAdded) {
        // Wait 500ms to ensure backend has saved the product
        setTimeout(() => {
          onProductAdded();
        }, 500);
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create product. Please try again.';
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const data = err.response.data;
        
        if (data?.detail) {
          errorMessage = Array.isArray(data.detail) 
            ? data.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ')
            : data.detail;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (status === 404) {
          errorMessage = 'API endpoint not found. Please check the API URL.';
        } else if (status === 422) {
          errorMessage = 'Validation error. Please check your input fields.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error ${status}: ${data?.error || 'Unknown error'}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your network connection and API URL.';
      } else if (err.message) {
        // Error setting up the request
        errorMessage = `Request error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col bg-white border-0 p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
            {initialProduct ? 'Duplicate Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {initialProduct ? 'Edit the product details and create a new product' : 'Enter product details to begin compliance monitoring'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {error && (
                <div className="col-span-1 md:col-span-2 bg-red-50 border-0 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-600">
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Smart Home Speaker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))]"
                />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Description *
                </Label>
                <textarea
                  id="description"
                  placeholder="e.g., IoT temperature control device with WiFi connectivity"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-link-color))]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Product Type *
                </Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'existing' | 'new')}
                  className="w-full border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-link-color))]"
                >
                  <option value="existing">Existing Product</option>
                  <option value="new">New Product (in development)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="markets" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Target Markets *
                </Label>
                <Input
                  id="markets"
                  placeholder="e.g., EU, US, UK (comma-separated)"
                  value={markets}
                  onChange={(e) => setMarkets(e.target.value)}
                  required
                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))]"
                />
                <p className="text-xs text-gray-500">
                  Enter comma-separated market codes
                </p>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="urls" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Product URLs
                </Label>
                <Input
                  id="urls"
                  placeholder="e.g., https://example.com/product, https://..."
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))]"
                />
                <p className="text-xs text-gray-500">
                  Enter comma-separated URLs (optional, helps AI analyze product)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Upload Documents (optional)
                </Label>
                <div className="border-0 bg-dashboard-view-background p-4 h-full">
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadedFiles(files);
                    }}
                    className="text-sm text-gray-500 w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, Word, Excel, PowerPoint, Text files
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-[hsl(var(--dashboard-link-color))]">
                      {uploadedFiles.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Upload Product Images (optional)
                </Label>
                <div className="border-0 bg-dashboard-view-background p-4 h-full">
                  <input
                    type="file"
                    id="image-file-input"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadedImages(files);
                    }}
                    className="text-sm text-gray-500 w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPEG, JPG images for AI vision analysis
                  </p>
                  {uploadedImages.length > 0 && (
                    <div className="mt-2 text-xs text-[hsl(var(--dashboard-link-color))]">
                      {uploadedImages.length} image(s) selected
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="define-components"
                    checked={defineComponents}
                    onChange={(e) => setDefineComponents(e.target.checked)}
                    className="w-4 h-4 text-[hsl(var(--dashboard-link-color))] bg-dashboard-view-background border-0 focus:ring-0"
                  />
                  <Label htmlFor="define-components" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))] cursor-pointer">
                    Define components manually
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Manually specify product components to guide the AI analysis
                </p>

                {defineComponents && (
                  <div className="space-y-3 mt-4">
                    {components.map((component, index) => (
                      <div key={index} className="border-0 bg-dashboard-view-background p-4 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[hsl(var(--dashboard-link-color))]">
                            Component {index + 1}
                          </span>
                          {components.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeComponentRow(index)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Component title (e.g., Battery Pack)"
                            value={component.title}
                            onChange={(e) => updateComponent(index, 'title', e.target.value)}
                            className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] text-sm"
                          />
                          <Input
                            placeholder="Component description (e.g., Lithium-ion battery, 3000mAh)"
                            value={component.description}
                            onChange={(e) => updateComponent(index, 'description', e.target.value)}
                            className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addComponentRow}
                      className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-300 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add another component
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-dashboard-view-background p-4 space-y-2 col-span-1 md:col-span-2">
                <h4 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                  What happens next?
                </h4>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• System analyzes product and identifies compliance requirements</li>
                  <li>• Compliance elements are linked from shared knowledge base</li>
                  <li>• You'll receive notifications for regulatory updates</li>
                  <li>• Background processing will complete in 2-5 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 p-6 pt-2 border-t border-gray-100 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name || !description || !markets}
              className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
            >
              {isSubmitting ? 'Adding...' : initialProduct ? 'Create Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

}

