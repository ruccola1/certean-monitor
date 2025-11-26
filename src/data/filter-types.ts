export interface FilterDataItemJson {
  id: string;
  label: string;
  checked?: boolean;
  children?: FilterDataItemJson[];
  dynamic?: boolean; // If true, children are populated dynamically (e.g., Products list)
}

export interface FilterDataJson {
  type: 'simple' | 'accordion';
  items: FilterDataItemJson[];
}

export interface AllFilterDataJson {
  markets: FilterDataJson;
  inventory: FilterDataJson;
  areas: FilterDataJson;
  entity: FilterDataJson;
}

