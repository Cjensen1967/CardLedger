// ─── Core domain types ────────────────────────────────────────────────────────

export interface CardType {
  id: string;
  name: string;
  decksPerBox: number;
  boxesPerCase: number;
  active: boolean;
}

export interface Color {
  id: string;
  name: string;
  cardTypeIds: string[]; // which card types this color applies to
  active: boolean;
}

export interface Employee {
  id: string;
  employeeId: string; // badge / ID number
  name: string;
  role: 'security' | 'gaming_management' | 'admin';
  active: boolean;
}

export interface PropertySettings {
  propertyName: string;
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfOutputDir: string;
  printMode: 'pdf_only' | 'auto_print' | 'prompt' | 'configurable';
}

export interface PackagingRules {
  allowPartialBoxes: boolean;
}

// ─── Admin store shape ────────────────────────────────────────────────────────

export interface AdminStore {
  settings: PropertySettings;
  packagingRules: PackagingRules;
  cardTypes: CardType[];
  colors: Color[];
  employees: Employee[];
}
