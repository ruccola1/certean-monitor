export interface FilterDataItemJson {
  id: string;
  label: string;
  checked?: boolean;
  children?: FilterDataItemJson[];
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

