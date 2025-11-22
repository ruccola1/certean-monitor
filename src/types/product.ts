export interface Product {
  id: string;
  name: string;
  description: string;
  type: 'existing' | 'future' | 'imaginary';
  urls: string[];
  markets: string[];
  status: ProductStatus;
  step0Status: StepStatus;
  step1Status: StepStatus;
  step2Status: StepStatus;
  step3Status: StepStatus;
  step4Status: StepStatus;
  components: Component[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type ProductStatus = 
  | 'pending' 
  | 'processing' 
  | 'needs_review' 
  | 'complete' 
  | 'error';

export type StepStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'needs_review';

export interface Component {
  id: string;
  productId: string;
  parentId?: string; // For child components
  name: string;
  description: string;
  technicalSpecifications?: string;
  materials?: string[];
  category?: string;
  step1Result?: Step1Result;
}

export interface Step1Result {
  complianceAssessment: string;
  riskAreas: string[];
  testingRequirements: string[];
}

export interface ComplianceElement {
  id: string;
  name: string;
  type: 'regulation' | 'standard' | 'certification' | 'marking';
  description: string;
  applicability: string;
  isMandatory: boolean;
  markets: string[];
  inSharedDb: boolean;
  updates: ComplianceUpdate[];
}

export interface ComplianceUpdate {
  id: string;
  elementId: string;
  title: string;
  description: string;
  date: string;
  source?: string;
  type: 'deadline' | 'revision' | 'new_requirement';
}


