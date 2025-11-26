import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComplianceUpdate {
  id: string;
  _id?: string;
  title?: string;
  description?: string;
  update?: string;
  update_date?: string;
  date?: string;
  element_name?: string;
  name?: string;
  element_type?: string;
  type?: string;
  impact?: string;
  source?: string;
  source_url?: string;
  url?: string;
  product_id?: string;
  product_name?: string;
  market?: string | string[];
}

interface MonthData {
  key: string; // Format: "2025-01"
  year: number;
  month: number;
  displayLabel: string;
  updates: ComplianceUpdate[];
}

export default function ComplianceNavigator() {
  const { user } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [complianceUpdates, setComplianceUpdates] = useState<ComplianceUpdate[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, string>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Selection and line drawing state
  const [selectedElementName, setSelectedElementName] = useState<string | null>(null);
  const [relatedEntryPositions, setRelatedEntryPositions] = useState<Array<{id: string, rect: DOMRect, date: string}>>([]);
  const [isRelationSetByClick, setIsRelationSetByClick] = useState(false);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const clientId = getClientId(user);
    if (!clientId) return;

    setLoading(true);
    try {
      // Fetch products for name mapping
      const productsResponse = await apiService.get(`/products?client_id=${clientId}`);
      const products = productsResponse.data?.products || [];
      const pMap = new Map<string, string>();
      products.forEach((p: any) => {
        pMap.set(p.id || p._id, p.name);
      });
      setProductsMap(pMap);

      // Fetch compliance updates
      const updatesResponse = await apiService.get(`/compliance/updates?client_id=${clientId}`);
      const updates: ComplianceUpdate[] = updatesResponse.data?.updates || [];
      setComplianceUpdates(updates);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate months from 10 years back to 10 years forward
  const monthColumns = useMemo(() => {
    const months: MonthData[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Start 10 years back
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const date = new Date(year, month, 1);
        const displayLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        months.push({
          key,
          year,
          month: month + 1,
          displayLabel,
          updates: []
        });
      }
    }
    
    return months;
  }, []);

  // Group updates by month
  const monthsWithUpdates = useMemo(() => {
    const monthMap = new Map<string, ComplianceUpdate[]>();
    
    complianceUpdates.forEach(update => {
      const dateStr = update.update_date || update.date;
      if (dateStr) {
        const date = new Date(dateStr);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthMap.has(key)) {
          monthMap.set(key, []);
        }
        monthMap.get(key)!.push(update);
      }
    });
    
    // Sort updates within each month chronologically
    monthMap.forEach((updates) => {
      updates.sort((a, b) => {
        const dateA = new Date(a.update_date || a.date || '').getTime();
        const dateB = new Date(b.update_date || b.date || '').getTime();
        return dateA - dateB;
      });
    });
    
    // Merge with month columns
    return monthColumns.map(month => ({
      ...month,
      updates: monthMap.get(month.key) || []
    }));
  }, [monthColumns, complianceUpdates]);

  // Get the index of the current month for initial scroll
  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return monthsWithUpdates.findIndex(m => m.key === currentKey);
  }, [monthsWithUpdates]);

  // Center on current month on initial load
  useEffect(() => {
    if (!loading && scrollContainerRef.current && currentMonthIndex >= 0 && !hasUserScrolled) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const monthWidth = 200; // Width of each month column
      const scrollPosition = currentMonthIndex * monthWidth - (containerWidth / 2) + (monthWidth / 2);
      scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [loading, currentMonthIndex, hasUserScrolled]);

  // Get element name from update
  const getElementName = (update: ComplianceUpdate): string => {
    return update.element_name || update.name || 'Unknown';
  };

  // Get update ID
  const getUpdateId = (update: ComplianceUpdate): string => {
    return update.id || update._id || `${update.title}-${update.update_date}`;
  };

  // Should highlight entry
  const shouldHighlightEntry = (update: ComplianceUpdate): boolean => {
    if (!selectedElementName) return false;
    return getElementName(update) === selectedElementName;
  };

  // Should dim entry
  const shouldDimEntry = (update: ComplianceUpdate): boolean => {
    if (!selectedElementName) return false;
    return getElementName(update) !== selectedElementName;
  };

  // Handle entry click
  const handleEntryClick = (update: ComplianceUpdate, _event: React.MouseEvent) => {
    const elementName = getElementName(update);
    setSelectedElementName(elementName);
    setIsRelationSetByClick(true);
    setHighlightedEntryId(getUpdateId(update));
    
    // Find all related updates
    const relatedUpdates = complianceUpdates.filter(u => getElementName(u) === elementName);
    
    // Get positions with delay
    setTimeout(() => {
      const positions: Array<{id: string, rect: DOMRect, date: string}> = [];
      relatedUpdates.forEach(relatedUpdate => {
        const element = document.querySelector(`[data-entry-id="${getUpdateId(relatedUpdate)}"]`) as HTMLElement;
        if (element) {
          const rect = element.getBoundingClientRect();
          positions.push({
            id: getUpdateId(relatedUpdate),
            rect,
            date: relatedUpdate.update_date || relatedUpdate.date || ''
          });
        }
      });
      
      positions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRelatedEntryPositions(positions);
    }, 10);
  };

  // Handle hover
  const handleEntryMouseEnter = (update: ComplianceUpdate) => {
    if (isRelationSetByClick) return;
    
    const elementName = getElementName(update);
    setSelectedElementName(elementName);
    
    const relatedUpdates = complianceUpdates.filter(u => getElementName(u) === elementName);
    
    setTimeout(() => {
      const positions: Array<{id: string, rect: DOMRect, date: string}> = [];
      relatedUpdates.forEach(relatedUpdate => {
        const element = document.querySelector(`[data-entry-id="${getUpdateId(relatedUpdate)}"]`) as HTMLElement;
        if (element) {
          const rect = element.getBoundingClientRect();
          positions.push({
            id: getUpdateId(relatedUpdate),
            rect,
            date: relatedUpdate.update_date || relatedUpdate.date || ''
          });
        }
      });
      
      positions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRelatedEntryPositions(positions);
    }, 10);
  };

  // Handle hover leave
  const handleEntryMouseLeave = () => {
    if (!isRelationSetByClick) {
      setSelectedElementName(null);
      setRelatedEntryPositions([]);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedElementName(null);
    setRelatedEntryPositions([]);
    setIsRelationSetByClick(false);
    setHighlightedEntryId(null);
  };

  // Update positions on scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setHasUserScrolled(true);
      
      if (selectedElementName && relatedEntryPositions.length > 0) {
        const relatedUpdates = complianceUpdates.filter(u => getElementName(u) === selectedElementName);
        
        const positions: Array<{id: string, rect: DOMRect, date: string}> = [];
        relatedUpdates.forEach(relatedUpdate => {
          const element = document.querySelector(`[data-entry-id="${getUpdateId(relatedUpdate)}"]`) as HTMLElement;
          if (element) {
            const rect = element.getBoundingClientRect();
            positions.push({
              id: getUpdateId(relatedUpdate),
              rect,
              date: relatedUpdate.update_date || relatedUpdate.date || ''
            });
          }
        });
        
        positions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setRelatedEntryPositions(positions);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedElementName, relatedEntryPositions.length, complianceUpdates]);

  // Escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRelationSetByClick) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRelationSetByClick]);

  // Connecting lines component
  const ConnectingLines = () => {
    if (relatedEntryPositions.length < 2) return null;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return null;

    const containerRect = scrollContainer.getBoundingClientRect();
    
    return (
      <svg
        className="absolute pointer-events-none z-0"
        style={{
          top: 0,
          left: 0,
          width: scrollContainer.scrollWidth,
          height: scrollContainer.scrollHeight,
        }}
      >
        {relatedEntryPositions.slice(0, -1).map((position, index) => {
          const nextPosition = relatedEntryPositions[index + 1];
          
          const x1 = position.rect.left - containerRect.left + scrollContainer.scrollLeft + position.rect.width;
          const y1 = position.rect.top - containerRect.top + scrollContainer.scrollTop + position.rect.height / 2;
          const x2 = nextPosition.rect.left - containerRect.left + scrollContainer.scrollLeft;
          const y2 = nextPosition.rect.top - containerRect.top + scrollContainer.scrollTop + nextPosition.rect.height / 2;

          const pos1Left = position.rect.left - containerRect.left + scrollContainer.scrollLeft;
          const pos2Left = nextPosition.rect.left - containerRect.left + scrollContainer.scrollLeft;
          const horizontalDistance = Math.abs(pos2Left - pos1Left);

          let pathData: string;

          if (horizontalDistance < 100) {
            // Vertical line
            const centerX = position.rect.left - containerRect.left + scrollContainer.scrollLeft + position.rect.width / 2;
            const startY = position.rect.top - containerRect.top + scrollContainer.scrollTop + position.rect.height;
            const endY = nextPosition.rect.top - containerRect.top + scrollContainer.scrollTop;
            pathData = `M ${centerX} ${startY} L ${centerX} ${endY}`;
          } else if (x2 <= x1) {
            return null;
          } else {
            const midX = x1 + 30;
            if (Math.abs(x2 - x1) > 200) {
              const intermediateX = x1 + (x2 - x1) * 0.6;
              pathData = `M ${x1} ${y1} L ${midX} ${y1} L ${intermediateX} ${y1} L ${intermediateX} ${y2} L ${x2} ${y2}`;
            } else {
              pathData = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            }
          }

          return (
            <path
              key={`${position.id}-${nextPosition.id}`}
              d={pathData}
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.8"
              fill="none"
            />
          );
        })}
      </svg>
    );
  };

  // Get impact color
  const getImpactColor = (impact?: string) => {
    if (!impact) return 'border-l-gray-300';
    switch (impact.toUpperCase()) {
      case 'HIGH': return 'border-l-red-500';
      case 'MEDIUM': return 'border-l-amber-500';
      case 'LOW': return 'border-l-green-500';
      default: return 'border-l-blue-400';
    }
  };

  // Get type badge color
  const getTypeBadgeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    const t = type.toLowerCase();
    if (t.includes('legislation') || t.includes('regulation')) return 'bg-blue-100 text-blue-700';
    if (t.includes('standard')) return 'bg-purple-100 text-purple-700';
    if (t.includes('marking')) return 'bg-cyan-100 text-cyan-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Calculate days until/ago
  const getDaysText = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `in ${diffDays}d`;
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    return 'today';
  };

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full bg-dashboard-view-background">
      {/* Full width timeline container */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              <span className="text-lg text-gray-500">Loading compliance timeline...</span>
            </div>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="flex h-full overflow-x-auto relative py-4"
            style={{ scrollBehavior: 'smooth' }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const isEntry = target.closest('[data-entry-id]');
              if (!isEntry) {
                clearSelection();
              }
            }}
          >
            <ConnectingLines />
            
            {monthsWithUpdates.map((month) => {
              const isCurrentMonth = month.key === currentMonthKey;
              const hasUpdates = month.updates.length > 0;
              
              return (
                <div 
                  key={month.key}
                  data-month={month.key}
                  className="flex flex-col items-start min-w-[180px] relative px-2 h-full flex-shrink-0"
                >
                  {/* Month header */}
                  <div className={cn(
                    "sticky top-0 z-10 w-full pb-2 pt-1",
                    isCurrentMonth ? "bg-blue-50" : "bg-dashboard-view-background"
                  )}>
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "text-xs font-bold",
                        isCurrentMonth 
                          ? "text-blue-600" 
                          : hasUpdates 
                            ? "text-[hsl(var(--dashboard-link-color))]" 
                            : "text-gray-400"
                      )}>
                        {month.displayLabel}
                      </h3>
                      {hasUpdates && (
                        <Badge className="bg-gray-100 text-gray-600 border-0 text-[9px] px-1">
                          {month.updates.length}
                        </Badge>
                      )}
                    </div>
                    {isCurrentMonth && (
                      <div className="text-[9px] text-blue-500 mt-0.5">Current</div>
                    )}
                  </div>

                  {/* Vertical dotted line separator */}
                  <div className="absolute top-0 bottom-0 right-0 w-px">
                    <div className={cn(
                      "h-full w-full border-l border-dotted",
                      hasUpdates ? "border-gray-300" : "border-gray-200"
                    )} />
                  </div>

                  {/* Updates */}
                  <div className="flex-1 overflow-y-auto space-y-2 pt-1 pb-4 w-full">
                    {month.updates.map((update) => {
                      const updateId = getUpdateId(update);
                      const title = update.title || '';
                      const description = update.description || update.update || '';
                      const dateStr = update.update_date || update.date || '';
                      const impact = update.impact;
                      const elementType = update.element_type || update.type || '';
                      const sourceUrl = update.source || update.source_url || update.url;
                      const productName = update.product_name || (update.product_id ? productsMap.get(update.product_id) : '');
                      const elementName = getElementName(update);
                      
                      const isHighlighted = highlightedEntryId === updateId;
                      const shouldHighlight = shouldHighlightEntry(update);
                      const shouldDim = shouldDimEntry(update);
                      const isPast = dateStr && new Date(dateStr) < new Date();
                      
                      return (
                        <TooltipProvider key={updateId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                data-entry-id={updateId}
                                className={cn(
                                  "w-full p-2 border-l-3 cursor-pointer transition-all duration-150",
                                  getImpactColor(impact),
                                  isHighlighted
                                    ? "bg-[hsl(var(--dashboard-link-color))] text-white"
                                    : shouldHighlight
                                      ? "bg-blue-100"
                                      : shouldDim
                                        ? "opacity-30 bg-white"
                                        : isPast 
                                          ? "bg-gray-50"
                                          : "bg-white hover:bg-gray-50"
                                )}
                                style={{ borderLeftWidth: '3px' }}
                                onClick={(e) => handleEntryClick(update, e)}
                                onMouseEnter={() => handleEntryMouseEnter(update)}
                                onMouseLeave={handleEntryMouseLeave}
                              >
                                {/* Date */}
                                <div className={cn(
                                  "text-[9px] font-mono mb-1",
                                  isHighlighted ? "text-white/80" : "text-gray-500"
                                )}>
                                  {dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No date'}
                                  <span className="ml-1 text-[8px]">({getDaysText(dateStr)})</span>
                                </div>
                                
                                {/* Title */}
                                <p className={cn(
                                  "text-[11px] font-semibold leading-tight line-clamp-2 mb-1",
                                  isHighlighted ? "text-white" : isPast ? "text-gray-600" : "text-[hsl(var(--dashboard-link-color))]"
                                )}>
                                  {title || description.slice(0, 50) + '...'}
                                </p>
                                
                                {/* Element name */}
                                <p className={cn(
                                  "text-[9px] line-clamp-1 mb-1",
                                  isHighlighted ? "text-white/70" : "text-gray-400"
                                )}>
                                  {elementName}
                                </p>
                                
                                {/* Type badge */}
                                {elementType && (
                                  <Badge className={cn(
                                    "text-[8px] border-0 px-1 py-0",
                                    isHighlighted ? "bg-white/20 text-white" : getTypeBadgeColor(elementType)
                                  )}>
                                    {elementType.includes('legislation') || elementType.includes('regulation') ? 'Legislation' :
                                     elementType.includes('standard') ? 'Standard' : 
                                     elementType.includes('marking') ? 'Marking' : elementType}
                                  </Badge>
                                )}
                                
                                {/* Source link */}
                                {sourceUrl && (
                                  <a 
                                    href={sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                      "inline-flex items-center gap-0.5 text-[8px] mt-1",
                                      isHighlighted ? "text-white/80 hover:text-white" : "text-blue-500 hover:text-blue-600"
                                    )}
                                  >
                                    <ExternalLink className="w-2 h-2" />
                                    Source
                                  </a>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs bg-white border border-gray-200 p-3 shadow-lg">
                              <p className="text-sm font-bold text-[hsl(var(--dashboard-link-color))] mb-1">{title}</p>
                              <p className="text-xs text-gray-500 mb-2">{elementName}</p>
                              {description && <p className="text-xs text-gray-600 mb-2">{description.substring(0, 200)}...</p>}
                              <div className="flex flex-wrap gap-1.5">
                                {elementType && (
                                  <Badge className={cn("text-[9px] border-0 px-1.5 py-0.5", getTypeBadgeColor(elementType))}>
                                    {elementType}
                                  </Badge>
                                )}
                                {impact && (
                                  <Badge className={cn("text-[9px] border-0 px-1.5 py-0.5", 
                                    impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' :
                                    impact.toUpperCase() === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                    'bg-green-100 text-green-700'
                                  )}>
                                    {impact.toUpperCase()} Impact
                                  </Badge>
                                )}
                              </div>
                              {productName && (
                                <p className="text-[10px] text-gray-400 mt-2">Product: {productName}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    
                    {/* Empty month placeholder */}
                    {month.updates.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-gray-300">
                        <Bell className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
