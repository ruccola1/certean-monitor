import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { fetchClientInfo } from '@/services/clientService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';
import { productService } from '@/services/productService';
import { apiService } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Cache utilities for faster dashboard loading
const CACHE_KEYS = {
  PRODUCTS: 'dashboard_products_cache',
  UPDATES: 'dashboard_updates_cache',
  SUMMARY: 'dashboard_summary_cache',
  CLIENT: 'dashboard_client_cache',
};

const CACHE_TTL = {
  PRODUCTS: 5 * 60 * 1000,  // 5 minutes
  UPDATES: 5 * 60 * 1000,   // 5 minutes
  SUMMARY: 10 * 60 * 1000,  // 10 minutes
  CLIENT: 30 * 60 * 1000,   // 30 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  clientId: string;
}

function getCache<T>(key: string, clientId: string | null, ttl: number): T | null {
  if (!clientId) return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > ttl;
    const isWrongClient = entry.clientId !== clientId;
    
    if (isExpired || isWrongClient) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, clientId: string | null): void {
  if (!clientId) return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      clientId,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage might be full, ignore
  }
}

interface Product {
  id: string;
  name: string;
  status: string;
  step0Status: string;
  step1Status: string;
  step2Status: string;
  metrics?: {
    componentsCount?: number;
    complianceElementsCount?: number;
    complianceUpdatesCount?: number;
  };
  step0Results?: {
    quality_score?: number;
    is_sufficient?: boolean;
  };
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
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [clientName, setClientName] = useState<string>('Your Company');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Get user's first name
  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  // Filter handlers
  const handleToggleFilter = useCallback((filterId: string, isChecked: boolean) => {
    setActiveFilters(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(filterId);
      } else {
        newSet.delete(filterId);
      }
      return newSet;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  // Fetch client name (with caching)
  useEffect(() => {
    const loadClientInfo = async () => {
      const clientId = getClientId(user);
      
      // Check cache first
      const cachedClient = getCache<string>(CACHE_KEYS.CLIENT, clientId, CACHE_TTL.CLIENT);
      if (cachedClient) {
        setClientName(cachedClient);
        return;
      }
      
      const clientInfo = await fetchClientInfo(user);
      if (clientInfo && clientInfo.client_name) {
        setClientName(clientInfo.client_name);
        setCache(CACHE_KEYS.CLIENT, clientInfo.client_name, clientId);
      }
    };

    if (user) {
      loadClientInfo();
    }
  }, [user]);

  // Load cached data immediately, then refresh in background
  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user?.sub) {
        console.log('User not loaded yet, waiting...');
        return;
      }

      const clientId = getClientId(user);
      console.log('Dashboard initializing with caching...');
      
      // STEP 1: Load cached data IMMEDIATELY (instant UI)
      const cachedProducts = getCache<Product[]>(CACHE_KEYS.PRODUCTS, clientId, CACHE_TTL.PRODUCTS);
      const cachedUpdates = getCache<any[]>(CACHE_KEYS.UPDATES, clientId, CACHE_TTL.UPDATES);
      const cachedSummary = getCache<string>(CACHE_KEYS.SUMMARY, clientId, CACHE_TTL.SUMMARY);
      const cachedClient = getCache<string>(CACHE_KEYS.CLIENT, clientId, CACHE_TTL.CLIENT);
      
      if (cachedProducts) {
        console.log('Using cached products:', cachedProducts.length);
        setProducts(cachedProducts);
        setLoading(false);
      }
      if (cachedUpdates) {
        console.log('Using cached updates:', cachedUpdates.length);
        setComplianceUpdates(cachedUpdates);
      }
      if (cachedSummary) {
        console.log('Using cached summary');
        setSummary(cachedSummary);
        setSummaryLoading(false);
      }
      if (cachedClient) {
        setClientName(cachedClient);
      }
      
      // STEP 2: Refresh data in background (stale-while-revalidate)
      console.log('Refreshing data in background...');
      
      // First fetch products and updates (needed for fallback summary)
      await Promise.all([
        fetchProducts(),
        fetchComplianceUpdates(),
      ]);
      
      // Then fetch AI summary (can use updates data for fallback)
      await fetchDashboardSummary();
      
      console.log('Dashboard initialization complete');
    };

    initializeDashboard();
  }, [user?.sub]);

  // Optimized polling: Only refresh if there are processing products
  useEffect(() => {
    // Don't start polling until we have initial data
    if (!user?.sub || loading) return;

    const interval = setInterval(() => {
      // Only poll if there are products in processing state
      const hasProcessingProducts = products.some(p => 
        p.status === 'processing' ||
        p.step0Status === 'running' ||
        p.step1Status === 'running' ||
        p.step2Status === 'running'
      );

      if (hasProcessingProducts) {
        console.log('Polling: Processing products detected, refreshing...');
        fetchProducts();
        fetchComplianceUpdates();
      } else {
        console.log('Polling: All products idle, skipping refresh');
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user?.sub, products, loading]);

  const fetchProducts = useCallback(async () => {
    try {
      const clientId = getClientId(user);
      const response = await productService.getAll(clientId, false);
      const data = response.data || [];
      setProducts(data);
      // Cache the results
      setCache(CACHE_KEYS.PRODUCTS, data, clientId);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchComplianceUpdates = useCallback(async () => {
    try {
      const clientId = getClientId(user);
      if (!clientId) return;
      
      const response = await apiService.get(`/api/products/${clientId}/compliance-updates`);
      const updates = response.data?.updates || [];
      setComplianceUpdates(updates);
      // Cache the results
      setCache(CACHE_KEYS.UPDATES, updates, clientId);
    } catch (error) {
      console.error('Failed to fetch compliance updates:', error);
    }
  }, [user]);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      if (!user?.sub) return;
      
      const clientId = getClientId(user);
      
      // Timeout after 30 seconds (AI generation can take time)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      console.log('Fetching dashboard summary for client:', clientId);
      const response = await apiService.get(
        `/api/dashboard/summary?client_id=${encodeURIComponent(clientId || '')}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      console.log('Dashboard summary response:', response.data);
      
      // Handle different response formats
      if (response.data?.success && response.data?.data?.text) {
        const text = response.data.data.text;
        setSummary(text);
        // Cache the results
        setCache(CACHE_KEYS.SUMMARY, text, clientId);
      } else if (response.data?.text) {
        // Direct text format
        setSummary(response.data.text);
        setCache(CACHE_KEYS.SUMMARY, response.data.text, clientId);
      } else if (typeof response.data === 'string') {
        // Plain string response
        setSummary(response.data);
        setCache(CACHE_KEYS.SUMMARY, response.data, clientId);
      } else {
        console.log('No summary text in response:', response.data);
        // Generate a fallback based on compliance updates count
        const updatesCount = complianceUpdates.length;
        if (updatesCount > 0) {
          setSummary(`You have ${updatesCount} compliance updates to review. Check the details below for upcoming regulatory changes.`);
        } else {
          setSummary("Your compliance monitoring dashboard is ready. Add products and run compliance analysis to see updates.");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Dashboard summary request timed out after 30s');
        // Generate fallback summary based on available data
        const updatesCount = complianceUpdates.length;
        if (updatesCount > 0) {
          setSummary(`You have ${updatesCount} compliance updates across your products. Review the timeline below for details.`);
        } else {
          setSummary("Loading compliance insights...");
        }
      } else {
        console.error('Failed to fetch dashboard summary:', error);
        setSummary("Your compliance monitoring dashboard");
      }
    } finally {
      setSummaryLoading(false);
    }
  }, [user, complianceUpdates]);

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

  // Calculate average comprehensiveness score
  const productsWithScore = products.filter(p => 
    p.step0Results?.quality_score !== undefined && p.step0Results.quality_score > 0
  );
  const averageComprehensiveness = productsWithScore.length > 0
    ? Math.round(productsWithScore.reduce((sum, p) => sum + (p.step0Results?.quality_score || 0), 0) / productsWithScore.length)
    : 0;

  // Aggregate compliance updates by year-month - OPTIMIZED for speed
  const chartData = useMemo(() => {
    if (!complianceUpdates || complianceUpdates.length === 0) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Calculate date boundaries once (5 years before, 5 years after = more focused range)
    const minDate = new Date(currentYear - 5, currentMonth, 1);
    const maxDate = new Date(currentYear + 5, currentMonth, 28);
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    
    // Aggregate only months that have data (lazy initialization)
    const monthlyAggregation: { [key: string]: { 
      legislation: number, 
      standard: number, 
      marking: number,
      titles: string[] 
    } } = {};
    
    // Single pass through updates
    for (let i = 0; i < complianceUpdates.length; i++) {
      const update = complianceUpdates[i];
      const updateDate = update?.update_date || update?.date;
      if (!updateDate) continue;
      
      const date = new Date(updateDate);
      const dateTime = date.getTime();
      
      // Skip if outside range
      if (dateTime < minTime || dateTime > maxTime) continue;
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Lazy initialize month
      if (!monthlyAggregation[yearMonth]) {
        monthlyAggregation[yearMonth] = { legislation: 0, standard: 0, marking: 0, titles: [] };
      }
      
      // Add title to the list
      const title = update?.title || update?.regulation || update?.name || 'Untitled Update';
      monthlyAggregation[yearMonth].titles.push(title);
      
      // Fast type categorization
      const elementType = (update?.element_type || update?.type || '').toLowerCase();
      if (elementType.includes('standard')) {
        monthlyAggregation[yearMonth].standard++;
      } else if (elementType.includes('marking')) {
        monthlyAggregation[yearMonth].marking++;
      } else {
        monthlyAggregation[yearMonth].legislation++;
      }
    }
    
    // Generate full range with empty months (only 120 months = 10 years)
    const result: Array<{date: string, displayDate: string, legislation: number, standard: number, marking: number, total: number, titles: string[]}> = [];
    
    for (let i = -60; i <= 59; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const yearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const data = monthlyAggregation[yearMonth] || { legislation: 0, standard: 0, marking: 0, titles: [] };
      
      result.push({
        date: yearMonth,
        displayDate: targetDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        legislation: data.legislation,
        standard: data.standard,
        marking: data.marking,
        total: data.legislation + data.standard + data.marking,
        titles: data.titles
      });
    }
    
    return result;
  }, [complianceUpdates]);

  // Custom tooltip for the chart
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0]?.payload;
    if (!data || data.total === 0) return null;
    
    return (
      <div className="bg-white p-3 shadow-lg border-0 max-w-xs">
        <p className="font-bold text-sm text-gray-800 mb-2" style={{ fontFamily: 'Geist Mono, monospace' }}>
          {label}
        </p>
        <div className="space-y-1 mb-2">
          {data.legislation > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-[#3b82f6]"></div>
              <span>Legislation: {data.legislation}</span>
            </div>
          )}
          {data.marking > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-[#93c5fd]"></div>
              <span>Markings: {data.marking}</span>
            </div>
          )}
          {data.standard > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-[#60a5fa]"></div>
              <span>Standards: {data.standard}</span>
            </div>
          )}
        </div>
        {data.titles && data.titles.length > 0 && (
          <div className="border-t border-gray-100 pt-2 mt-2">
            <p className="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Updates:</p>
            <ul className="space-y-0.5">
              {data.titles.slice(0, 5).map((title: string, idx: number) => (
                <li key={idx} className="text-[10px] text-gray-600 truncate" title={title}>
                  {title.length > 40 ? title.substring(0, 40) + '...' : title}
                </li>
              ))}
              {data.titles.length > 5 && (
                <li className="text-[10px] text-gray-400 italic">
                  +{data.titles.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Calculate FUTURE and PAST compliance updates - OPTIMIZED
  const { futureComplianceUpdates, pastComplianceUpdates } = useMemo(() => {
    if (!complianceUpdates || complianceUpdates.length === 0) {
      return { futureComplianceUpdates: 0, pastComplianceUpdates: 0 };
    }
    
    const nowTime = new Date().setHours(0, 0, 0, 0);
    let futureCount = 0;
    let pastCount = 0;
    
    for (let i = 0; i < complianceUpdates.length; i++) {
      const update = complianceUpdates[i];
      const updateDate = update?.update_date || update?.date;
      if (updateDate) {
        if (new Date(updateDate).getTime() >= nowTime) {
          futureCount++;
        } else {
          pastCount++;
        }
      }
    }
    
    return { futureComplianceUpdates: futureCount, pastComplianceUpdates: pastCount };
  }, [complianceUpdates]);
  
  // Calculate total compliance elements from pre-computed metrics (much faster)
  const totalComplianceElements = products.reduce((sum, product) => {
    return sum + (product.metrics?.complianceElementsCount || 0);
  }, 0);

  // Calculate compliance elements breakdown by type
  const complianceElementsBreakdown = useMemo(() => {
    const breakdown = { legislation: 0, standard: 0, marking: 0 };
    
    for (const product of products) {
      const elements = product.step2Results?.compliance_elements || [];
      for (const element of elements) {
        const elementType = (element?.element_type || element?.type || '').toLowerCase();
        if (elementType.includes('standard')) {
          breakdown.standard++;
        } else if (elementType.includes('marking')) {
          breakdown.marking++;
        } else {
          breakdown.legislation++;
        }
      }
    }
    
    return breakdown;
  }, [products]);

  return (
    <div className="min-h-screen bg-dashboard-view-background">
      {/* Top Filterbar */}
      <ProductFilterbar 
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={handleClearFilters}
      />
      
      <div className="p-4 md:p-8">
        <div className="max-w-7xl space-y-4 md:space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Welcome {userName} at {clientName}</h1>
            {summaryLoading ? (
              <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-1 md:mt-2">
                Analyzing compliance updates...
              </p>
            ) : summary ? (
              <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-1 md:mt-2 whitespace-pre-line">
                {summary}
              </p>
            ) : (
              <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-1 md:mt-2">
                Your compliance monitoring dashboard
              </p>
            )}
          </div>
          <Button 
            onClick={() => setIsAddProductOpen(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white shrink-0"
          >
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-white border-0 shadow-subtle">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Products</CardTitle>
              <CardDescription className="text-sm text-gray-500">Total products monitored</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="flex items-baseline gap-4">
                    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{products.length}</div>
                    {productsWithScore.length > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold font-mono ${
                          averageComprehensiveness >= 70 ? 'text-green-600' :
                          averageComprehensiveness >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {averageComprehensiveness}%
                        </span>
                        <span className="text-xs text-gray-500">avg. data comprehensiveness</span>
                      </div>
                    )}
                  </div>
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

          <Card className="bg-white border-0 shadow-subtle">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Compliance Elements</CardTitle>
              <CardDescription className="text-sm text-gray-500">Tracked regulations & standards</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="flex items-baseline gap-4">
                    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{totalComplianceElements}</div>
                    {totalComplianceElements > 0 && (
                      <div className="flex items-baseline gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-blue-600">{complianceElementsBreakdown.legislation}</span>
                          <span className="text-xs text-gray-500">legislation</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-purple-600">{complianceElementsBreakdown.standard}</span>
                          <span className="text-xs text-gray-500">standards</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-cyan-600">{complianceElementsBreakdown.marking}</span>
                          <span className="text-xs text-gray-500">markings</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    {totalComplianceElements > 0 ? (
                      <span className="text-xs text-gray-500">From {products.filter(p => (p.metrics?.complianceElementsCount || 0) > 0).length} products</span>
                    ) : (
                      <span className="text-xs text-gray-500">No elements yet</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-subtle">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Upcoming Updates</CardTitle>
              <CardDescription className="text-sm text-gray-500">Future compliance changes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              ) : (
                <>
                  <div className="flex items-baseline gap-4">
                    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{futureComplianceUpdates}</div>
                    {pastComplianceUpdates > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-gray-400">{pastComplianceUpdates}</span>
                        <span className="text-xs text-gray-500">previous</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    {futureComplianceUpdates > 0 ? (
                      <span className="text-xs text-gray-500">Scheduled updates</span>
                    ) : (
                      <span className="text-xs text-gray-500">No upcoming updates</span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compliance Updates Timeline Chart */}
        <Card className="bg-white border-0 shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Product-Related Compliance Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-1 px-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: 'Updates', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' } }}
                  tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'Geist Mono, monospace' }}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  allowDataOverflow={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
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
            {/* Timeline label below x-axis */}
            <div className="text-center mt-1 mb-2">
              <span className="text-xs text-gray-500" style={{ fontFamily: 'Geist Mono, monospace' }}>Timeline</span>
            </div>
            {/* Custom legend below Timeline */}
            <div className="flex items-center justify-center gap-4 pb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#3b82f6]"></div>
                <span className="text-xs text-gray-600" style={{ fontFamily: 'Geist Mono, monospace' }}>Legislation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#93c5fd]"></div>
                <span className="text-xs text-gray-600" style={{ fontFamily: 'Geist Mono, monospace' }}>Markings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#60a5fa]"></div>
                <span className="text-xs text-gray-600" style={{ fontFamily: 'Geist Mono, monospace' }}>Standards</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {products.length === 0 && !loading && (
          <Card className="bg-white border-0 shadow-subtle">
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
          <Card className="bg-white border-0 shadow-subtle">
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

        <Card className="bg-white border-0 shadow-subtle">
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
      </div>

      <AddProductDialog 
        open={isAddProductOpen} 
        onOpenChange={setIsAddProductOpen}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}



