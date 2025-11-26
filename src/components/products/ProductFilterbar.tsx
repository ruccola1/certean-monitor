import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, SlidersHorizontal, Users, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterDataItemJson, FilterDataJson, AllFilterDataJson } from '@/data/filter-types';
import filterDataJson from '@/data/filterbar-data.json';

const typedFilterDataJson = filterDataJson as AllFilterDataJson;

interface FilterDropdownProps {
  label: string;
  icon?: React.ElementType;
  filterConfig: FilterDataJson;
  idPrefix: string;
  activeFilters: Set<string>;
  onToggleFilter: (filterId: string, isChecked: boolean) => void;
}

// Checkbox component with indeterminate support
const FilterCheckbox = ({
  id,
  checked,
  indeterminate,
  onCheckedChange,
  className,
  onClick,
}: {
  id: string;
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: () => void;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const checkboxRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={checkboxRef}
      id={id}
      onClick={(e) => {
        onClick?.(e);
        onCheckedChange();
      }}
      className={cn(
        "w-4 h-4 border flex items-center justify-center cursor-pointer flex-shrink-0",
        checked || indeterminate
          ? "bg-white border-white"
          : "bg-transparent border-white/60",
        className
      )}
    >
      {checked && !indeterminate && (
        <svg className="w-3 h-3 text-[hsl(var(--dashboard-link-color))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {indeterminate && (
        <div className="w-2 h-0.5 bg-[hsl(var(--dashboard-link-color))]" />
      )}
    </div>
  );
};

const FilterDropdown = ({ label, icon: Icon, filterConfig, idPrefix, activeFilters, onToggleFilter }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  // Helper function to get all descendant IDs
  const getAllDescendantIds = (item: FilterDataItemJson): string[] => {
    const descendantIds: string[] = [];
    if (item.children) {
      item.children.forEach(child => {
        descendantIds.push(child.id);
        descendantIds.push(...getAllDescendantIds(child));
      });
    }
    return descendantIds;
  };

  // Helper function to check if a parent should be in indeterminate state
  const getCheckboxState = (item: FilterDataItemJson): { checked: boolean; indeterminate: boolean } => {
    if (!item.children || item.children.length === 0) {
      return { checked: activeFilters.has(item.id), indeterminate: false };
    }
    
    const allDescendantIds = getAllDescendantIds(item);
    const selectedDescendantIds = allDescendantIds.filter(id => activeFilters.has(id));
    
    if (selectedDescendantIds.length === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedDescendantIds.length === allDescendantIds.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  const handleItemCheckedChange = (item: FilterDataItemJson) => {
    const currentState = getCheckboxState(item);
    const newCheckedState = !currentState.checked && !currentState.indeterminate;

    if (item.children && item.children.length > 0) {
      // Toggle all children
      const allChildIds = getAllDescendantIds(item);
      allChildIds.forEach(childId => {
        onToggleFilter(childId, newCheckedState);
      });
    } else {
      onToggleFilter(item.id, newCheckedState);
    }
  };

  const toggleAccordion = (itemId: string) => {
    setOpenAccordionItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderCheckboxItem = (item: FilterDataItemJson, level: number = 0) => {
    const { checked, indeterminate } = getCheckboxState(item);
    
    return (
      <div 
        key={`${idPrefix}-${item.id}`} 
        className={cn(
          "flex items-center space-x-2 py-1.5 px-2 hover:bg-white/10 cursor-pointer",
          level === 1 && "pl-6",
          level === 2 && "pl-10",
          level >= 3 && "pl-14"
        )}
        onClick={() => handleItemCheckedChange(item)}
      >
        <FilterCheckbox
          id={`${idPrefix}-${item.id}`}
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={() => {}}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm text-white cursor-pointer">
          {item.label}
        </span>
      </div>
    );
  };

  // Recursive function to render accordion items at any depth
  const renderAccordionItem = (item: FilterDataItemJson, level: number = 0) => {
    const { checked, indeterminate } = getCheckboxState(item);
    const isExpanded = openAccordionItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    // Calculate padding based on level
    const paddingClass = level === 0 ? "px-2" : level === 1 ? "pl-6 pr-2" : level === 2 ? "pl-10 pr-2" : "pl-14 pr-2";

    return (
      <div key={`${idPrefix}-${item.id}`}>
        <div 
          className={cn(
            "flex items-center py-1.5 hover:bg-white/10 cursor-pointer",
            paddingClass
          )}
          onClick={() => hasChildren && toggleAccordion(item.id)}
        >
          <FilterCheckbox
            id={`${idPrefix}-${item.id}`}
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={() => handleItemCheckedChange(item)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-sm text-white ml-2 flex-1">
            {item.label}
          </span>
          {hasChildren && (
            <ChevronDown className={cn(
              "h-4 w-4 text-white/60 transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )} />
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => {
              // If child has children, render as nested accordion
              if (child.children && child.children.length > 0) {
                return renderAccordionItem(child, level + 1);
              }
              // Otherwise render as simple checkbox
              return renderCheckboxItem(child, level + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  // Calculate active filters for this section
  const getActiveFiltersForSection = () => {
    const activeFiltersInSection: string[] = [];
    
    const processItem = (item: FilterDataItemJson) => {
      if (!item.children || item.children.length === 0) {
        if (activeFilters.has(item.id)) {
          activeFiltersInSection.push(item.label);
        }
      } else {
        const allDescendantIds = getAllDescendantIds(item);
        const selectedDescendantIds = allDescendantIds.filter(id => activeFilters.has(id));
        
        if (selectedDescendantIds.length === allDescendantIds.length && allDescendantIds.length > 0) {
          activeFiltersInSection.push(item.label);
        } else if (selectedDescendantIds.length > 0) {
          item.children.forEach(child => processItem(child));
        }
      }
    };
    
    filterConfig.items.forEach(item => processItem(item));
    return activeFiltersInSection;
  };

  const activeFiltersInSection = getActiveFiltersForSection();
  const activeCount = activeFiltersInSection.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-full",
            "border-none text-white px-3 text-sm flex items-center gap-1.5 font-bold",
            "bg-transparent hover:bg-white/10",
            "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
          )}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {Icon && <Icon className="h-4 w-4 text-white flex-shrink-0" />}
            <span className="flex-shrink-0">{label}</span>
            {activeCount > 0 && (
              <div className="flex items-center gap-1 min-w-0">
                <Badge className="bg-white text-[hsl(var(--dashboard-link-color))] text-xs px-1.5 py-0.5 rounded-none flex-shrink-0">
                  {activeCount}
                </Badge>
                {activeCount <= 2 && (
                  <span className="text-xs opacity-60 truncate">
                    {activeFiltersInSection.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
          {isOpen ? <ChevronUp className="ml-auto h-4 w-4 flex-shrink-0" /> : <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "w-[var(--radix-dropdown-menu-trigger-width)] bg-[hsl(var(--dashboard-link-color))] p-0 backdrop-blur-sm border-none rounded-none",
          "max-h-[calc(70vh-4rem)]",
          "overflow-hidden",
          "flex flex-col"
        )}
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 max-h-96 overflow-y-auto">
          {filterConfig.type === 'simple' && filterConfig.items.map(item => renderCheckboxItem(item, 0))}
          {filterConfig.type === 'accordion' && filterConfig.items.map(item => {
            if (item.children && item.children.length > 0) {
              return renderAccordionItem(item, 0);
            }
            return renderCheckboxItem(item, 0);
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface FilterConfig {
  label: string;
  icon: React.ElementType;
  dataKey: keyof AllFilterDataJson;
}

// Dynamic product for the Products filter
export interface DynamicProduct {
  id: string;
  name: string;
}

interface ProductFilterbarProps {
  activeFilters: Set<string>;
  onToggleFilter: (filterId: string, isChecked: boolean) => void;
  onClearFilters: () => void;
  dynamicProducts?: DynamicProduct[]; // Optional list of products to show in Inventory > Products
}

export function ProductFilterbar({ activeFilters, onToggleFilter, onClearFilters, dynamicProducts = [] }: ProductFilterbarProps) {
  const filters: FilterConfig[] = [
    { label: 'Markets', icon: MapPin, dataKey: 'markets' },
    { label: 'Inventory', icon: Package, dataKey: 'inventory' },
    { label: 'Areas', icon: SlidersHorizontal, dataKey: 'areas' },
    { label: 'Entity', icon: Users, dataKey: 'entity' },
  ];

  const hasActiveFilters = activeFilters.size > 0;

  // Function to inject dynamic products into the inventory filter config
  const getFilterConfigWithDynamicData = (filterConfig: FilterDataJson, dataKey: string): FilterDataJson => {
    if (dataKey !== 'inventory' || dynamicProducts.length === 0) {
      return filterConfig;
    }

    // Deep clone the config to avoid mutating the original
    const clonedConfig: FilterDataJson = JSON.parse(JSON.stringify(filterConfig));
    
    // Find the Products item and inject dynamic children
    const productsItem = clonedConfig.items.find(item => item.id === 'inv_products');
    if (productsItem) {
      productsItem.children = dynamicProducts.map(product => ({
        id: `product_${product.id}`,
        label: product.name,
        checked: false
      }));
    }
    
    return clonedConfig;
  };

  return (
    <div className="w-full bg-[hsl(var(--dashboard-link-color))] px-4 py-0 h-12 flex items-center shadow-subtle">
      <div className="flex items-center h-full w-full">
        {filters.map((filter, index) => {
          const baseFilterConfig = typedFilterDataJson[filter.dataKey] as FilterDataJson;
          
          if (!baseFilterConfig) {
            console.warn(`Filter data for key "${filter.dataKey}" not found.`);
            return null;
          }
          
          // Inject dynamic data if needed
          const filterConfigData = getFilterConfigWithDynamicData(baseFilterConfig, filter.dataKey);
          
          return (
            <div key={filter.label} className="flex items-center h-full flex-1 max-w-[310px]">
              <div className="flex-1 h-full">
                <FilterDropdown
                  label={filter.label}
                  icon={filter.icon}
                  filterConfig={filterConfigData}
                  idPrefix={filter.dataKey}
                  activeFilters={activeFilters}
                  onToggleFilter={onToggleFilter}
                />
              </div>
              {index < filters.length - 1 && (
                <div className="w-px h-full bg-white/30 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2 flex-shrink-0 text-white hover:bg-white/10 hover:text-white focus-visible:ring-0"
          onClick={onClearFilters}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Clear all filters</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-auto flex-shrink-0 text-white hover:bg-white/10 hover:text-white focus-visible:ring-0"
      >
        <Plus className="h-5 w-5" />
        <span className="sr-only">Saved Filters</span>
      </Button>
    </div>
  );
}
