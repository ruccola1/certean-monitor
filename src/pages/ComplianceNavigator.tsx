import { useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';
import { apiService } from '@/services/api';
import { Loader2, Calendar, Search, ExternalLink, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface ComplianceUpdate {
  id?: string;
  regulation?: string;
  title?: string;
  description?: string;
  update_date?: string;
  date?: string;
  impact?: string;
  source?: string;
  source_url?: string;
  url?: string;
  product_id?: string;
  product_name?: string;
  element_type?: string;
  type?: string;
}

interface GroupedUpdates {
  [yearMonth: string]: ComplianceUpdate[];
}

export default function ComplianceNavigator() {
  const { user } = useAuth0();
  const [updates, setUpdates] = useState<ComplianceUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'future' | 'past'>('future');

  // Fetch all compliance updates
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!user?.sub) return;
      
      try {
        const clientId = getClientId(user);
        if (!clientId) return;
        
        const response = await apiService.get(`/api/products/${clientId}/compliance-updates`);
        const allUpdates = response.data?.updates || [];
        setUpdates(allUpdates);
        
        // Auto-expand the next 3 months with updates
        const today = new Date();
        const futureUpdates = allUpdates.filter((u: ComplianceUpdate) => {
          const date = u.update_date || u.date;
          return date && new Date(date) >= today;
        });
        
        const monthsToExpand = new Set<string>();
        futureUpdates.slice(0, 20).forEach((u: ComplianceUpdate) => {
          const date = new Date(u.update_date || u.date || '');
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthsToExpand.add(yearMonth);
        });
        setExpandedMonths(monthsToExpand);
      } catch (error) {
        console.error('Failed to fetch compliance updates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [user?.sub]);

  // Filter and group updates
  const { groupedUpdates, totalCount, futureCount, pastCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter by search query
    let filtered = updates;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = updates.filter(u => 
        (u.regulation?.toLowerCase().includes(query)) ||
        (u.title?.toLowerCase().includes(query)) ||
        (u.description?.toLowerCase().includes(query)) ||
        (u.product_name?.toLowerCase().includes(query))
      );
    }
    
    // Filter by time
    if (filterType === 'future') {
      filtered = filtered.filter(u => {
        const date = u.update_date || u.date;
        return date && new Date(date) >= today;
      });
    } else if (filterType === 'past') {
      filtered = filtered.filter(u => {
        const date = u.update_date || u.date;
        return date && new Date(date) < today;
      });
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = a.update_date || a.date || '';
      const dateB = b.update_date || b.date || '';
      return filterType === 'past' 
        ? dateB.localeCompare(dateA) // Descending for past
        : dateA.localeCompare(dateB); // Ascending for future
    });
    
    // Group by year-month
    const grouped: GroupedUpdates = {};
    filtered.forEach(update => {
      const date = update.update_date || update.date || '';
      if (!date) return;
      const d = new Date(date);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      grouped[yearMonth].push(update);
    });
    
    // Count future and past
    let future = 0, past = 0;
    updates.forEach(u => {
      const date = u.update_date || u.date;
      if (date) {
        if (new Date(date) >= today) future++;
        else past++;
      }
    });
    
    return { 
      groupedUpdates: grouped, 
      totalCount: filtered.length,
      futureCount: future,
      pastCount: past
    };
  }, [updates, searchQuery, filterType]);

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearMonth)) {
        newSet.delete(yearMonth);
      } else {
        newSet.add(yearMonth);
      }
      return newSet;
    });
  };

  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 0) return `In ${diff} days`;
    if (diff === -1) return 'Yesterday';
    return `${Math.abs(diff)} days ago`;
  };

  const getImpactColor = (impact?: string) => {
    if (!impact) return 'border-blue-400';
    switch (impact.toUpperCase()) {
      case 'HIGH': return 'border-red-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'LOW': return 'border-green-500';
      default: return 'border-blue-400';
    }
  };

  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    const t = type.toLowerCase();
    if (t.includes('legislation') || t.includes('regulation') || t.includes('directive')) {
      return 'bg-blue-50 text-blue-700';
    }
    if (t.includes('standard')) {
      return 'bg-purple-50 text-purple-700';
    }
    if (t.includes('marking')) {
      return 'bg-cyan-50 text-cyan-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  // Filter handlers
  const handleToggleFilter = (filterId: string, isChecked: boolean) => {
    setActiveFilters(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(filterId);
      } else {
        newSet.delete(filterId);
      }
      return newSet;
    });
  };

  const handleClearFilters = () => {
    setActiveFilters(new Set());
  };

  return (
    <div className="min-h-screen bg-dashboard-view-background">
      {/* Top Filterbar */}
      <ProductFilterbar 
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={handleClearFilters}
      />
      
      <div className="p-4 md:p-8">
        <div className="max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
                Compliance Navigator
              </h1>
              <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-1 md:mt-2">
                Timeline of all compliance updates across your products
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card className="bg-white border-0 shadow-subtle">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search updates, regulations, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-0 bg-dashboard-view-background"
                  />
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('future')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      filterType === 'future'
                        ? 'bg-[hsl(var(--dashboard-link-color))] text-white'
                        : 'bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200'
                    }`}
                  >
                    Upcoming ({futureCount})
                  </button>
                  <button
                    onClick={() => setFilterType('past')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      filterType === 'past'
                        ? 'bg-[hsl(var(--dashboard-link-color))] text-white'
                        : 'bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200'
                    }`}
                  >
                    Previous ({pastCount})
                  </button>
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-[hsl(var(--dashboard-link-color))] text-white'
                        : 'bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))] hover:bg-gray-200'
                    }`}
                  >
                    All ({updates.length})
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {loading ? (
            <Card className="bg-white border-0 shadow-subtle">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--dashboard-link-color))]" />
                <span className="ml-3 text-gray-500">Loading compliance updates...</span>
              </CardContent>
            </Card>
          ) : totalCount === 0 ? (
            <Card className="bg-white border-0 shadow-subtle">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-link-color))] mb-2">
                  No Updates Found
                </h3>
                <p className="text-sm text-gray-500">
                  {searchQuery 
                    ? 'No updates match your search criteria. Try a different search term.'
                    : filterType === 'future' 
                      ? 'No upcoming compliance updates. Run Step 4 on your products to identify updates.'
                      : filterType === 'past'
                        ? 'No past compliance updates found.'
                        : 'Add products and run compliance analysis to see updates here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="text-sm text-gray-500 mb-4">
                Showing {totalCount} update{totalCount !== 1 ? 's' : ''} in {Object.keys(groupedUpdates).length} month{Object.keys(groupedUpdates).length !== 1 ? 's' : ''}
              </div>
              
              {/* Grouped by month */}
              {Object.entries(groupedUpdates).map(([yearMonth, monthUpdates]) => {
                const isExpanded = expandedMonths.has(yearMonth);
                const monthLabel = formatYearMonth(yearMonth);
                
                // Check if this month has any urgent updates (within 30 days)
                const today = new Date();
                const hasUrgent = monthUpdates.some(u => {
                  const date = u.update_date || u.date;
                  if (!date) return false;
                  const d = new Date(date);
                  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diff >= 0 && diff <= 30;
                });
                
                return (
                  <Card key={yearMonth} className="bg-white border-0 shadow-subtle overflow-hidden">
                    {/* Month Header */}
                    <button
                      onClick={() => toggleMonth(yearMonth)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <Calendar className="w-5 h-5 text-[hsl(var(--dashboard-link-color))]" />
                        <h3 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                          {monthLabel}
                        </h3>
                        <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">
                          {monthUpdates.length} update{monthUpdates.length !== 1 ? 's' : ''}
                        </Badge>
                        {hasUrgent && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </button>
                    
                    {/* Updates List */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {monthUpdates.map((update, idx) => {
                          const date = update.update_date || update.date || '';
                          const sourceUrl = update.source || update.source_url || update.url;
                          const elementType = update.element_type || update.type || '';
                          
                          return (
                            <div 
                              key={`${update.id || idx}`}
                              className={`p-4 border-l-4 ${getImpactColor(update.impact)} ${
                                idx !== monthUpdates.length - 1 ? 'border-b border-gray-50' : ''
                              } hover:bg-gray-50 transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Date and days */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-gray-500">
                                      {new Date(date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 ${
                                      getDaysUntil(date).includes('ago') 
                                        ? 'bg-gray-100 text-gray-500' 
                                        : getDaysUntil(date) === 'Today' || getDaysUntil(date) === 'Tomorrow'
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-blue-50 text-blue-600'
                                    }`}>
                                      {getDaysUntil(date)}
                                    </span>
                                  </div>
                                  
                                  {/* Regulation name */}
                                  <h4 className="text-sm font-semibold text-[hsl(var(--dashboard-link-color))] mb-1">
                                    {update.regulation || update.title || 'Unnamed Update'}
                                  </h4>
                                  
                                  {/* Title if different from regulation */}
                                  {update.title && update.regulation && update.title !== update.regulation && (
                                    <p className="text-xs text-gray-600 mb-1">
                                      {update.title}
                                    </p>
                                  )}
                                  
                                  {/* Description */}
                                  {update.description && (
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                      {update.description}
                                    </p>
                                  )}
                                  
                                  {/* Tags */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {elementType && (
                                      <Badge className={`text-[10px] border-0 ${getTypeColor(elementType)}`}>
                                        {elementType.charAt(0).toUpperCase() + elementType.slice(1)}
                                      </Badge>
                                    )}
                                    {update.product_name && (
                                      <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                                        {update.product_name}
                                      </Badge>
                                    )}
                                    {update.impact && (
                                      <Badge className={`text-[10px] border-0 ${
                                        update.impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                        update.impact.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {update.impact} Impact
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Link */}
                                {sourceUrl && (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="View source"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

