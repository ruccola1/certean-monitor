import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { eventLogService } from '@/services/eventLogService';
import type { EventLog } from '@/types/eventLog';
import { Loader2, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';

const ACTION_LABELS: Record<string, string> = {
  product_added: 'Product Added',
  product_deleted: 'Product Deleted',
  product_duplicated: 'Product Duplicated',
  product_edited: 'Product Edited',
  step_executed: 'Step Executed',
  step_rerun: 'Step Re-run',
  categories_configured: 'Categories Configured'
};

const ACTION_COLORS: Record<string, string> = {
  product_added: 'bg-green-100 text-green-800',
  product_deleted: 'bg-red-100 text-red-800',
  product_duplicated: 'bg-blue-100 text-blue-800',
  product_edited: 'bg-yellow-100 text-yellow-800',
  step_executed: 'bg-purple-100 text-purple-800',
  step_rerun: 'bg-orange-100 text-orange-800',
  categories_configured: 'bg-gray-100 text-gray-800'
};

export default function LoggedEvents() {
  const { user } = useAuth0();
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const logsPerPage = 50;

  const fetchLogs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const clientId = getClientId(user);
      
      console.log('🔍 Fetching event logs for client:', clientId);
      
      const filters: any = {};
      if (actionFilter) filters.action = actionFilter;
      if (startDate) filters.start_date = new Date(startDate).toISOString();
      if (endDate) filters.end_date = new Date(endDate).toISOString();
      
      console.log('📊 Filters:', filters);
      
      const response = await eventLogService.getEventLogs(
        filters,
        logsPerPage,
        (currentPage - 1) * logsPerPage,
        clientId
      );
      
      console.log('✅ Event logs response:', response);
      
      if (response.success && response.data) {
        console.log('📋 Logs received:', response.data.logs?.length || 0);
        setLogs(response.data.logs || []);
        setTotalLogs(response.data.total || 0);
      } else {
        console.error('❌ Failed response:', response);
      }
    } catch (error) {
      console.error('❌ Failed to fetch event logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, currentPage, actionFilter, startDate, endDate]);

  const filteredLogs = searchTerm
    ? logs.filter(log => 
        log.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionDetails = (log: EventLog) => {
    if (log.action === 'step_executed' || log.action === 'step_rerun') {
      return `Step ${log.details?.step || 'Unknown'}`;
    }
    if (log.action === 'categories_configured') {
      return log.details?.category ? `${log.details.action}: ${log.details.category}` : '';
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-dashboard-view-background">
      {/* Filterbar */}
      <ProductFilterbar 
        activeFilters={new Set()} 
        onToggleFilter={() => {}} 
        onClearFilters={() => {}}
        dynamicProducts={[]}
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl space-y-8">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Logged Events</h1>
            <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
              Track all user actions and interactions within your workspace
            </p>
          </div>

        {/* Filters */}
        <Card className="bg-white border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Product, user, or action..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-0 bg-gray-50"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Action Type
                </Label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full h-10 px-3 border-0 bg-gray-50 text-sm"
                >
                  <option value="">All Actions</option>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Start Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 border-0 bg-gray-50"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  End Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 border-0 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(actionFilter || startDate || endDate || searchTerm) && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setActionFilter('');
                    setStartDate('');
                    setEndDate('');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-0 bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Logs Table */}
        <Card className="bg-white border-0">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-sm">No events found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[hsl(var(--dashboard-link-color))] uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                            {log.user_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.user_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'} border-0`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[hsl(var(--dashboard-link-color))] max-w-xs truncate">
                            {log.product_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {getActionDetails(log)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} events
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-0 bg-gray-100 hover:bg-gray-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-0 bg-gray-100 hover:bg-gray-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Total Events</div>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{totalLogs}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Current Page</div>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{currentPage} / {totalPages || 1}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Filtered Results</div>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">{filteredLogs.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0">
            <CardContent className="p-6">
              <div className="text-sm text-gray-500 mb-1">Active Filters</div>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                {[actionFilter, startDate, endDate, searchTerm].filter(Boolean).length}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

