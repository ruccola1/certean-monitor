import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Product {
  id: string;
  name: string;
  status: string;
  step0Status: string;
  step1Status: string;
  step2Status: string;
  step2Results?: {
    compliance_elements: Array<{
      designation?: string;
      type?: string;
      element_type?: string;
      [key: string]: any;
    }>;
  };
  step4Results?: {
    compliance_updates: Array<{
      regulation?: string;
      type?: string;
      [key: string]: any;
    }>;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [complianceUpdates, setComplianceUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user?.sub) {
      fetchComplianceUpdates();
    }
  }, [user]);

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

  const fetchComplianceUpdates = async () => {
    try {
      if (!user?.sub) {
        console.log('No user loaded yet, skipping compliance updates fetch');
        return;
      }
      const clientId = 'supercase'; // Use hardcoded client ID for now
      console.log('Fetching compliance updates for client:', clientId);
      const response = await apiService.get(`/api/products/${clientId}/compliance-updates`);
      console.log('Compliance updates response:', response.data);
      setComplianceUpdates(response.data?.updates || []);
    } catch (error) {
      console.error('Failed to fetch compliance updates:', error);
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

  // Aggregate compliance updates by year-month from shared database (10-year range)
  const chartData = useMemo(() => {
    // Generate 120-month range (60 before current, current, 59 after) = 10 years
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthlyAggregation: { [key: string]: { legislation: number, standard: number, marking: number } } = {};
    
    // Initialize all 120 months with 0 values
    for (let i = -60; i <= 59; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyAggregation[yearMonth] = { legislation: 0, standard: 0, marking: 0 };
    }
    
    // Aggregate actual data from compliance updates
    complianceUpdates.forEach((update: any) => {
      const updateDate = update?.update_date || update?.date;
      if (!updateDate) return;
      
      try {
        const date = new Date(updateDate);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Only include if within our 120-month range
        if (monthlyAggregation[yearMonth]) {
          const updateType = (update?.type || '').toLowerCase();
          
          // Categorize by type
          if (updateType.includes('standard') || updateType === 'standard') {
            monthlyAggregation[yearMonth].standard++;
          } else if (updateType.includes('marking') || updateType === 'marking') {
            monthlyAggregation[yearMonth].marking++;
          } else {
            monthlyAggregation[yearMonth].legislation++;
          }
        }
      } catch {
        console.error('Failed to parse date:', updateDate);
      }
    });
    
    // Convert to array and sort by date
    return Object.keys(monthlyAggregation)
      .sort()
      .map(yearMonth => {
        const [year, month] = yearMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        return {
          date: yearMonth,
          displayDate: monthName,
          legislation: monthlyAggregation[yearMonth].legislation,
          standard: monthlyAggregation[yearMonth].standard,
          marking: monthlyAggregation[yearMonth].marking,
          total: monthlyAggregation[yearMonth].legislation + monthlyAggregation[yearMonth].standard + monthlyAggregation[yearMonth].marking
        };
      });
  }, [complianceUpdates]);

  // Calculate total compliance updates
  const totalComplianceUpdates = chartData.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate total compliance elements from Step 2
  const totalComplianceElements = products.reduce((sum, product) => {
    return sum + (product.step2Results?.compliance_elements?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-dashboard-view-background p-4 md:p-8">
      <div className="max-w-7xl space-y-4 md:space-y-8">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Welcome Nicolas at Supercase</h1>
          <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-1 md:mt-2">
            Your compliance monitoring dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{totalComplianceElements}</div>
                  <div className="mt-3 space-y-1">
                    {totalComplianceElements > 0 ? (
                      <Badge className="bg-blue-100 text-blue-700 border-0">
                        From {products.filter(p => p.step2Results?.compliance_elements).length} products
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0">No elements yet</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Compliance Updates</CardTitle>
              <CardDescription className="text-sm text-gray-500">Total updates tracked</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{totalComplianceUpdates}</div>
                  <div className="mt-3 space-y-1">
                    {totalComplianceUpdates > 0 ? (
                      <Badge className="bg-orange-100 text-orange-700 border-0">
                        From {products.filter(p => p.step4Results?.compliance_updates).length} products
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0">No updates yet</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compliance Updates Timeline Chart */}
        <Card className="bg-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Product-Related Compliance Updates
            </CardTitle>
          </CardHeader>
          {chartData.length > 0 ? (
            <CardContent className="pt-2 pb-4 px-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Updates', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' } }}
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: '#1f2937', fontWeight: 'bold', fontSize: 11, fontFamily: 'Geist Mono, monospace' }}
                    itemStyle={{ fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
                  />
                  <Legend 
                    iconType="rect"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'Geist Mono, monospace' }}
                  />
                  <Bar 
                    dataKey="legislation" 
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                    name="Legislation"
                  />
                  <Bar 
                    dataKey="standard" 
                    stackId="a"
                    fill="#60a5fa"
                    radius={[0, 0, 0, 0]}
                    name="Standards"
                  />
                  <Bar 
                    dataKey="marking" 
                    stackId="a"
                    fill="#93c5fd"
                    radius={[2, 2, 0, 0]}
                    name="Markings"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          ) : (
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-sm">No compliance updates tracked yet. Complete Step 4 on your products to see data.</p>
            </CardContent>
          )}
        </Card>

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



