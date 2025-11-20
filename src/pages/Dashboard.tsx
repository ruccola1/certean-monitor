import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { productService } from '@/services/productService';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  status: string;
  step0Status: string;
  step1Status: string;
  step2Status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    setIsAddProductOpen(false);
    navigate('/products');
  };

  // Calculate status counts
  const statusCounts = {
    pending: products.filter(p => p.status === 'pending').length,
    processing: products.filter(p => p.status === 'processing').length,
    completed: products.filter(p => p.status === 'completed').length,
    error: products.filter(p => p.status === 'error').length,
  };

  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Welcome Nicolas at Supercase</h1>
          <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Your compliance monitoring dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Products</CardTitle>
              <CardDescription className="text-sm text-gray-500">Total products monitored</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{products.length}</div>
                  <div className="mt-3 space-y-1">
                    {statusCounts.completed > 0 && (
                      <Badge className="bg-green-50 text-green-700 border-0 mr-1">
                        {statusCounts.completed} completed
                      </Badge>
                    )}
                    {statusCounts.processing > 0 && (
                      <Badge className="bg-blue-50 text-blue-700 border-0 mr-1">
                        {statusCounts.processing} processing
                      </Badge>
                    )}
                    {statusCounts.pending > 0 && (
                      <Badge className="bg-gray-100 text-gray-700 border-0 mr-1">
                        {statusCounts.pending} pending
                      </Badge>
                    )}
                    {statusCounts.error > 0 && (
                      <Badge className="bg-red-50 text-red-700 border-0 mr-1">
                        {statusCounts.error} error
                      </Badge>
                    )}
                    {products.length === 0 && (
                      <Badge variant="secondary" className="border-0">No products yet</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Compliance Elements</CardTitle>
              <CardDescription className="text-sm text-gray-500">Tracked regulations & standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</div>
              <Badge variant="secondary" className="mt-2">0 / 5 used</Badge>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Notifications</CardTitle>
              <CardDescription className="text-sm text-gray-500">Pending compliance updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</div>
              <Badge variant="secondary" className="mt-2">All caught up</Badge>
            </CardContent>
          </Card>
        </div>

        {products.length === 0 && !loading && (
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Getting Started</CardTitle>
              <CardDescription className="text-sm text-gray-500">Add your first product to begin compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Welcome to Certean Monitor! Start by adding a product to automatically analyze compliance requirements,
                identify regulations and standards, and receive real-time updates.
              </p>
              <Button 
                onClick={() => setIsAddProductOpen(true)}
                className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
              >
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}

        {products.length > 0 && (
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Recent Products</CardTitle>
              <CardDescription className="text-sm text-gray-500">Your latest products and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">{product.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-500">Step 0: {product.step0Status}</span>
                        <span className="text-xs text-gray-500">Step 1: {product.step1Status}</span>
                        <span className="text-xs text-gray-500">Step 2: {product.step2Status}</span>
                      </div>
                    </div>
                    <Badge className={`border-0 ${
                      product.status === 'completed' ? 'bg-green-50 text-green-700' :
                      product.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      product.status === 'error' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => navigate('/products')}
                variant="outline"
                className="w-full mt-4 border-0 bg-gray-50 hover:bg-gray-100"
              >
                View All Products
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              System Status
              <Badge className="bg-green-500 text-white hover:bg-green-600">Connected</Badge>
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">Backend API connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">API Endpoint:</span>
                <span className="font-mono text-[hsl(var(--dashboard-link-color))]">{import.meta.env.VITE_API_BASE_URL || 'https://q57c4vz2em.eu-west-1.awsapprunner.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Frontend Version:</span>
                <span className="font-mono text-[hsl(var(--dashboard-link-color))]">1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddProductDialog 
        open={isAddProductOpen} 
        onOpenChange={setIsAddProductOpen}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}

