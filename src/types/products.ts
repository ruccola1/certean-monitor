/**
 * Product-related type definitions
 * Extracted from Products.tsx for better organization and reusability
 */

export interface Component {
  id: string;
  name: string;
  description: string;
  materials: string[];
  function: string;
}

export interface Step0Results {
  product_decomposition?: string;
  product_overview?: string;
  research_sources?: number;
  components_count?: number;
  categories?: string[];
  materials?: string[];
  quality_score?: number;
  quality_reasoning?: string;
  is_sufficient?: boolean;
  missing_info?: string[];
  recommendations?: string[];
  improvement_guidance?: string;
  component_completeness?: Array<{
    component_name: string;
    completeness_percentage: number;
    missing_details: string;
  }>;
  // Legacy
  components?: Component[];
  summary?: string;
  processingTime?: string;
  aiModel?: string;
}

export interface Step0Payload {
  product_decomposition?: string;
  product_overview?: string;
  product_name?: string;
  product_type?: string;
  target_markets?: string[];
  research_sources?: Array<{ url: string; content?: string }>;
  components?: Component[];
  categories?: string[];
  materials?: string[];
  is_editable?: boolean;
  edited?: boolean;
}

export interface ComponentAssessment {
  componentId: string;
  componentName: string;
  complianceRequirements: string[];
  riskLevel: string;
  testingRequired: string[];
}

export interface Step1Results {
  compliance_assessment: string;
  word_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  // Legacy structure (not used anymore)
  assessments?: ComponentAssessment[];
  summary?: string;
  processingTime?: string;
  aiModel?: string;
}

export interface ComplianceElement {
  id: string;
  name: string;
  type: string;
  applicability: string;
  markets: string[];
  isMandatory: boolean;
}

export interface Step2Results {
  compliance_elements: Array<{
    element_designation?: string;
    designation?: string;
    name?: string;
    element_name?: string;
    element_type?: string;
    type?: string;
    element_description_long?: string;
    description?: string;
    element_countries?: string[];
    countries?: string[];
    related_components?: string[];  // Component names this element applies to
    [key: string]: any;
  }>;
  elements_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  raw_response?: string;
  component_element_map?: Record<string, string[]>;  // Component name → Element names
  // Legacy
  complianceElements?: ComplianceElement[];
  totalElements?: number;
  categorizedBy?: string;
}

export interface Step3Results {
  compliance_sources: Array<{
    element_name?: string;
    name?: string;
    element_url?: string;
    url?: string;
    element_description?: string;
    description?: string;
    [key: string]: any;
  }>;
  sources_count: number;
  model_used: any;
  ai_count: number;
  target_markets: string[];
  raw_response?: string;
}

export interface Step4Results {
  compliance_updates: Array<{
    regulation?: string;
    title?: string;
    update_date?: string;
    type?: string;
    description?: string;
    impact?: string;
    compliance_deadline?: string;
    validity?: string;
    status?: string;
    is_mandatory?: boolean;
    [key: string]: any;
  }>;
  updates_count: number;
  model_used: any;
  ai_count: number;
  target_markets?: string[];
  raw_response?: string;
  compliance_updates_count?: number;
}

export interface Step3Payload {
  element_mappings: Array<{
    step2_element_name: string;
    step2_designation: string;
    shared_db_id: string | null;
    shared_db_name: string | null;
    source_official: string | null;
    found: boolean;
  }>;
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  type: string;
  manufactured_in?: string[];
  markets: string[];
  target_audience?: ('consumer' | 'business')[];
  status: string;
  step0Status: string;
  step1Status: string;
  step2Status: string;
  step3Status: string;
  step4Status: string;
  createdAt: string;
  step0Results?: Step0Results;
  step0Payload?: Step0Payload;
  step1Results?: Step1Results;
  step2Results?: Step2Results;
  step2Payload?: any;
  step3Payload?: Step3Payload;
  step3Results?: Step3Results;
  step4Results?: Step4Results;
  components?: Component[];
  step0Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step1Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step2Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step3Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
  step4Progress?: {
    current: string;
    percentage: number;
    steps: Array<{message: string; timestamp: string}>;
  };
}

export interface ComplianceArea {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}
