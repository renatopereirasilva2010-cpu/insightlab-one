// Tipos e enums que espelham services/api/prisma/schema.prisma.
// Fonte de verdade é o schema Prisma - manter em sincronia manualmente
// até existir geração automática de tipos compartilhados.

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW";

export type AppointmentSource = "INTERNAL" | "ONLINE_BOOKING" | "MANUAL";
export type ConfirmationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface Appointment {
  id: string;
  tenantId: string;
  unitId: string | null;
  clientId: string;
  professionalId: string | null;
  serviceId: string;
  resourceId: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  confirmationStatus: ConfirmationStatus;
  isWalkIn: boolean;
  isOverbook: boolean;
  notes: string | null;
  canceledAt: string | null;
  canceledReason: string | null;
  noShowAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentBlock {
  id: string;
  tenantId: string;
  unitId: string | null;
  professionalId: string | null;
  resourceId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalAvailability {
  id: string;
  tenantId: string;
  unitId: string | null;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "OPEN" | "IN_PROGRESS" | "FINISHED" | "CANCELED";

export interface Attendance {
  id: string;
  tenantId: string;
  unitId: string | null;
  appointmentId: string | null;
  clientId: string;
  professionalId: string | null;
  serviceId: string;
  status: AttendanceStatus;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = "OPEN" | "READY_FOR_CHECKOUT" | "COMPLETED" | "CANCELED";
export type SaleItemType = "SERVICE" | "PRODUCT";

export interface SaleItem {
  id: string;
  tenantId: string;
  unitId: string | null;
  saleId: string;
  itemType: SaleItemType;
  serviceId: string | null;
  productId: string | null;
  professionalId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  unitId: string | null;
  attendanceId: string | null;
  clientId: string | null;
  professionalId: string | null;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "DEFERRED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

export interface Payment {
  id: string;
  tenantId: string;
  unitId: string | null;
  saleId: string;
  cashRegisterId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  isDeferred: boolean;
  deferredDueDate: string | null;
  deferredSettledAt: string | null;
  commissionReleasedAt: string | null;
  externalReference: string | null;
  notes: string | null;
  paidAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  canceledAt: string | null;
  sale?: Sale;
  createdAt: string;
  updatedAt: string;
}

export type CashRegisterStatus = "OPEN" | "CLOSED";

export interface CashRegister {
  id: string;
  tenantId: string;
  unitId: string | null;
  name: string;
  status: CashRegisterStatus;
  openedAt: string | null;
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CommissionStatus = "PENDING" | "RELEASED" | "BLOCKED" | "CANCELED";
export type CommissionReleaseMode = "ON_PAYMENT" | "MANUAL" | "IMMEDIATE";

export interface Commission {
  id: string;
  tenantId: string;
  unitId: string | null;
  saleId: string;
  saleItemId: string;
  professionalId: string;
  baseAmount: number;
  commissionAmount: number;
  releaseMode: CommissionReleaseMode;
  status: CommissionStatus;
  releasedManually: boolean;
  releasedAt: string | null;
  notes: string | null;
  professional?: Professional;
  sale?: Sale;
  createdAt: string;
  updatedAt: string;
}

export type ClientStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface Client {
  id: string;
  tenantId: string;
  unitId: string | null;
  name: string;
  socialName: string | null;
  phone: string | null;
  email: string | null;
  status: ClientStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProfessionalStatus = "ACTIVE" | "INACTIVE";

export interface Professional {
  id: string;
  tenantId: string;
  unitId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  roleTitle: string | null;
  commissionRate: number | null;
  status: ProfessionalStatus;
  onlineBookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GenericStatus = "ACTIVE" | "INACTIVE";

export interface ServiceCatalogItem {
  id: string;
  tenantId: string;
  unitId: string | null;
  categoryId: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  cnaeCode: string | null;
  serviceListItemCode: string | null;
  issRate: number | null;
  availableOnline: boolean;
  requiresProfessional: boolean;
  status: GenericStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  unitId: string | null;
  categoryId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  cost: number | null;
  salePrice: number;
  stockQuantity: number | null;
  minStock: number | null;
  status: GenericStatus;
  createdAt: string;
  updatedAt: string;
}

export type FiscalDocumentSourceType = "SALE" | "PAYMENT" | "MANUAL";
export type FiscalDocumentType = "NFSE" | "NFE" | "NFCE";
export type FiscalDocumentStatus = "DRAFT" | "REQUESTED" | "AUTHORIZED" | "CANCELED" | "FAILED";
export type FiscalDocumentEventType =
  | "CREATED"
  | "REQUESTED"
  | "AUTHORIZED"
  | "CANCELED"
  | "ERROR"
  | "NOTE";

export interface FiscalDocumentEvent {
  id: string;
  fiscalDocumentId: string;
  eventType: FiscalDocumentEventType;
  message: string | null;
  payload: unknown;
  createdAt: string;
}

export interface FiscalDocument {
  id: string;
  tenantId: string;
  unitId: string | null;
  sourceType: FiscalDocumentSourceType;
  sourceId: string;
  documentType: FiscalDocumentType;
  status: FiscalDocumentStatus;
  provider: string | null;
  referenceNumber: string | null;
  accessKey: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestedAt: string | null;
  authorizedAt: string | null;
  canceledAt: string | null;
  events: FiscalDocumentEvent[];
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  unitId: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}

export interface BusinessSettings {
  id: string;
  tenantId: string;
  timezone: string;
  currency: string;
  cancelPolicyHours: number;
  lateToleranceMinutes: number;
  deferredPaymentLabel: string;
  allowDeferredPayment: boolean;
  commissionReleaseMode: CommissionReleaseMode;
  allowCommissionManualRelease: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalResource {
  id: string;
  tenantId: string;
  unitId: string | null;
  name: string;
  type: string;
  description: string | null;
  status: GenericStatus;
  createdAt: string;
  updatedAt: string;
}

// Forma de erro emitida pelo HttpExceptionFilter global da API.
export interface ApiErrorBody {
  code: string;
  title: string;
  message: string;
  recommendedAction: string;
  traceId: string | null;
}
