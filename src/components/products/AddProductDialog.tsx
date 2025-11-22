import { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'existing' | 'new'>('existing');
  const [urls, setUrls] = useState('');
  const [markets, setMarkets] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use Certean AI API key for backend authentication
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Concatenate name with description (matching certean-ai frontend)
      const fullDescription = `${name}: ${description}`;

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
          }
        ]
      };

      console.log('Adding product:', productData);
      
      // Call API to add product
      const response = await productService.createBulk(productData.products);
      
      console.log('Product created successfully:', response);

      // Auto-trigger Step 0 for the newly created product
      if (response.data && response.data.length > 0) {
        const productId = response.data[0].id;
        try {
          console.log('Starting Step 0 processing for product:', productId);
          await productService.runStep0(productId);
          console.log('Step 0 processing started successfully');
        } catch (error) {
          console.error('Failed to start Step 0:', error);
        }
      }

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
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
            Add New Product
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Enter product details to begin compliance monitoring
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="bg-red-50 border-0 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
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

            <div className="space-y-2">
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
                Enter comma-separated market codes (e.g., EU, US, UK, SE). 
                <span className="font-semibold"> Free: 1 market, Manager: 3 markets, Expert/Enterprise: Unlimited</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                Upload Documents (optional)
              </Label>
              <div className="border-0 bg-dashboard-view-background p-4">
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadedFiles(files);
                  }}
                  className="text-sm text-gray-500"
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
              <div className="border-0 bg-dashboard-view-background p-4">
                <input
                  type="file"
                  id="image-file-input"
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadedImages(files);
                  }}
                  className="text-sm text-gray-500"
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

            <div className="bg-dashboard-view-background p-4 space-y-2">
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

          <DialogFooter className="gap-2">
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
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

