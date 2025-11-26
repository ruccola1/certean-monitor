import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { apiService } from '@/services/api';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Bell, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';

const worldGeoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const usaGeoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Product {
  id: string;
  name: string;
  markets?: string[];
}

interface ComplianceUpdate {
  id: string;
  title?: string;
  element_name?: string;
  market?: string | string[];
  impact?: string;
  update_date?: string;
}

interface MapData {
  productsMarkets: string[];
  complianceElementsMarkets: string[];
  complianceUpdatesMarkets: string[];
  marketDetails: Record<string, {
    productCount: number;
    elementCount: number;
    updateCount: number;
    upcomingUpdates: number;
  }>;
}

interface HoverData {
  marketName: string;
  position: { x: number; y: number };
  productCount: number;
  elementCount: number;
  updateCount: number;
  upcomingUpdates: number;
  isLoading: boolean;
}

interface GeographyType {
  rsmKey: string;
  properties: {
    NAME?: string;
    NAME_LONG?: string;
    name?: string;
  };
}

export default function ComplianceMap() {
  const { user } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData>({
    productsMarkets: [],
    complianceElementsMarkets: [],
    complianceUpdatesMarkets: [],
    marketDetails: {}
  });
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch map data
  const fetchMapData = useCallback(async () => {
    if (!user) return;
    
    const clientId = getClientId(user);
    if (!clientId) return;

    setLoading(true);
    try {
      // Fetch products
      const productsResponse = await apiService.get(`/products?client_id=${clientId}`);
      const products: Product[] = productsResponse.data?.products || [];
      
      // Extract unique markets from products
      const productsMarketsSet = new Set<string>();
      products.forEach((product: Product) => {
        (product.markets || []).forEach(market => {
          productsMarketsSet.add(market.toUpperCase());
        });
      });

      // Fetch compliance updates
      const updatesResponse = await apiService.get(`/compliance/updates?client_id=${clientId}`);
      const updates: ComplianceUpdate[] = updatesResponse.data?.updates || [];
      
      // Extract unique markets from updates
      const updatesMarketsSet = new Set<string>();
      updates.forEach((update: ComplianceUpdate) => {
        const markets = Array.isArray(update.market) ? update.market : (update.market ? [update.market] : []);
        markets.forEach(market => {
          if (market) updatesMarketsSet.add(market.toUpperCase());
        });
      });

      // Build market details
      const marketDetails: MapData['marketDetails'] = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count products per market
      products.forEach((product: Product) => {
        (product.markets || []).forEach(market => {
          const normalizedMarket = market.toUpperCase();
          if (!marketDetails[normalizedMarket]) {
            marketDetails[normalizedMarket] = { productCount: 0, elementCount: 0, updateCount: 0, upcomingUpdates: 0 };
          }
          marketDetails[normalizedMarket].productCount++;
        });
      });

      // Count updates per market
      updates.forEach((update: ComplianceUpdate) => {
        const markets = Array.isArray(update.market) ? update.market : (update.market ? [update.market] : []);
        const isUpcoming = update.update_date && new Date(update.update_date) >= today;
        
        markets.forEach(market => {
          if (market) {
            const normalizedMarket = market.toUpperCase();
            if (!marketDetails[normalizedMarket]) {
              marketDetails[normalizedMarket] = { productCount: 0, elementCount: 0, updateCount: 0, upcomingUpdates: 0 };
            }
            marketDetails[normalizedMarket].updateCount++;
            if (isUpcoming) {
              marketDetails[normalizedMarket].upcomingUpdates++;
            }
          }
        });
      });

      setMapData({
        productsMarkets: Array.from(productsMarketsSet),
        complianceElementsMarkets: [], // Could be populated from dossiers
        complianceUpdatesMarkets: Array.from(updatesMarketsSet),
        marketDetails
      });
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Mouse move handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove]);

  // Get fill color for a geography
  const getFillColor = useCallback((geoName: string) => {
    const normalizedName = geoName.toUpperCase();
    const hasProducts = mapData.productsMarkets.includes(normalizedName);
    const hasUpdates = mapData.complianceUpdatesMarkets.includes(normalizedName);
    const details = mapData.marketDetails[normalizedName];
    
    // Priority: Blue (updates) > Yellow (products) > Default
    if (hasUpdates && details?.upcomingUpdates > 0) {
      return "hsl(210 60% 65%)"; // Blue - has upcoming compliance updates
    } else if (hasProducts) {
      return "hsl(45 90% 65%)"; // Yellow/Gold - has products
    } else if (hasUpdates) {
      return "hsl(210 30% 75%)"; // Light blue - has past updates only
    }
    return "hsl(0 0% 96%)"; // Default light gray
  }, [mapData]);

  // Handle geography hover
  const handleGeoHover = useCallback((geoName: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const normalizedName = geoName.toUpperCase();
    const details = mapData.marketDetails[normalizedName];
    
    setHoverData({
      marketName: geoName,
      position: mousePosition,
      productCount: details?.productCount || 0,
      elementCount: details?.elementCount || 0,
      updateCount: details?.updateCount || 0,
      upcomingUpdates: details?.upcomingUpdates || 0,
      isLoading: false
    });
  }, [mapData, mousePosition]);

  const handleHoverLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverData(null);
    }, 100);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }));
  };

  const handleZoomOut = () => {
    setPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalMarkets = new Set([...mapData.productsMarkets, ...mapData.complianceUpdatesMarkets]).size;
    const totalProducts = Object.values(mapData.marketDetails).reduce((sum, d) => sum + d.productCount, 0);
    const totalUpdates = Object.values(mapData.marketDetails).reduce((sum, d) => sum + d.updateCount, 0);
    const upcomingUpdates = Object.values(mapData.marketDetails).reduce((sum, d) => sum + d.upcomingUpdates, 0);
    
    return { totalMarkets, totalProducts, totalUpdates, upcomingUpdates };
  }, [mapData]);

  return (
    <div className="flex flex-col h-full bg-dashboard-view-background">
      {/* Filterbar */}
      <ProductFilterbar 
        activeFilters={new Set()} 
        onToggleFilter={() => {}} 
        onClearFilters={() => {}}
        dynamicProducts={[]}
      />

      {/* Map Container - Full Width */}
      <div className="flex-1 relative" ref={mapContainerRef}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-dashboard-view-background">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
              <span className="text-lg text-gray-500">Loading compliance map...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Map */}
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 150, center: [0, 30] }}
              className="w-full h-full"
              style={{ backgroundColor: 'hsl(210 20% 92%)' }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => setPosition({ coordinates, zoom })}
              >
                {/* World Countries */}
                <Geographies geography={worldGeoUrl}>
                  {({ geographies }: { geographies: GeographyType[] }) =>
                    geographies.map((geo: GeographyType) => {
                      const geoName = geo.properties.NAME || geo.properties.NAME_LONG || geo.properties.name || "";
                      const fillColor = getFillColor(geoName);
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => handleGeoHover(geoName)}
                          onMouseLeave={handleHoverLeave}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: "hsl(0 0% 80%)",
                              strokeWidth: 0.5 / position.zoom,
                              outline: "none",
                            },
                            hover: {
                              fill: "hsl(0 0% 85%)",
                              stroke: "hsl(0 0% 60%)",
                              strokeWidth: 0.75 / position.zoom,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: fillColor,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* US States */}
                <Geographies geography={usaGeoUrl}>
                  {({ geographies }: { geographies: GeographyType[] }) =>
                    geographies.map((geo: GeographyType) => {
                      const stateName = geo.properties.name || "";
                      const fillColor = getFillColor(stateName);
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => handleGeoHover(stateName)}
                          onMouseLeave={handleHoverLeave}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: "hsl(0 0% 80%)",
                              strokeWidth: 0.25 / position.zoom,
                              outline: "none",
                            },
                            hover: {
                              fill: "hsl(0 0% 85%)",
                              stroke: "hsl(0 0% 60%)",
                              strokeWidth: 0.5 / position.zoom,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: fillColor,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Hover Tooltip */}
            {hoverData && (
              <div
                className="absolute pointer-events-none z-50 bg-white p-3 shadow-lg border border-gray-200 min-w-[200px]"
                style={{
                  left: `${Math.min(hoverData.position.x + 15, (mapContainerRef.current?.clientWidth || 800) - 220)}px`,
                  top: `${Math.min(hoverData.position.y + 15, (mapContainerRef.current?.clientHeight || 600) - 150)}px`,
                }}
              >
                <h4 className="font-bold text-[hsl(var(--dashboard-link-color))] text-sm mb-2">{hoverData.marketName}</h4>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Package className="w-3 h-3 text-amber-500" />
                      Products
                    </span>
                    <span className="font-mono font-semibold">{hoverData.productCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Bell className="w-3 h-3 text-blue-500" />
                      Compliance Updates
                    </span>
                    <span className="font-mono font-semibold">{hoverData.updateCount}</span>
                  </div>
                  {hoverData.upcomingUpdates > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-blue-600 font-medium">Upcoming</span>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5">
                        {hoverData.upcomingUpdates}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-40">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                className="bg-white border-gray-200 hover:bg-gray-50 h-9 w-9 shadow-sm"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                className="bg-white border-gray-200 hover:bg-gray-50 h-9 w-9 shadow-sm"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="bg-white border-gray-200 hover:bg-gray-50 h-9 w-9 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 bg-white p-3 shadow-subtle border-0 z-40">
              <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-2">Legend</h5>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3" style={{ backgroundColor: 'hsl(210 60% 65%)' }}></span>
                  <span className="text-gray-600">Upcoming Compliance Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3" style={{ backgroundColor: 'hsl(45 90% 65%)' }}></span>
                  <span className="text-gray-600">Products Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3" style={{ backgroundColor: 'hsl(210 30% 75%)' }}></span>
                  <span className="text-gray-600">Past Updates Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3" style={{ backgroundColor: 'hsl(0 0% 96%)' }}></span>
                  <span className="text-gray-600">No Data</span>
                </div>
              </div>
            </div>

            {/* Summary Stats Card */}
            <div className="absolute top-6 right-6 z-40">
              <Card className="bg-white border-0 shadow-subtle">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">Global Overview</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Markets</span>
                      <span className="text-lg font-bold font-mono text-[hsl(var(--dashboard-link-color))]">{summaryStats.totalMarkets}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Products</span>
                      <span className="text-lg font-bold font-mono text-[hsl(var(--dashboard-link-color))]">{summaryStats.totalProducts}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Updates</span>
                      <span className="text-lg font-bold font-mono text-[hsl(var(--dashboard-link-color))]">{summaryStats.totalUpdates}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Upcoming</span>
                      <span className="text-lg font-bold font-mono text-blue-600">{summaryStats.upcomingUpdates}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Tooltip */}
            <div className="absolute top-6 left-6 z-40">
              <div className="bg-white p-3 shadow-subtle border-0 max-w-xs">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-[hsl(var(--dashboard-link-color))] mb-1">Compliance Map</h5>
                    <p className="text-[11px] text-gray-500">
                      Visualize your products and compliance updates across global markets. Hover over regions to see details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
