export type CanonicalRole = 'BUYER' | 'SELLER' | 'EMPLOYER' | 'DISPATCH_RIDER' | 'ADMIN';

export type UserRole =
  | CanonicalRole
  | 'admin'
  | 'buyer'
  | 'seller'
  | 'dispatcher'
  | 'employer'
  | 'employee'
  | 'Admin'
  | 'Buyer'
  | 'Seller'
  | 'Rider'
  | 'Job Seeker'
  | 'Employer'
  | 'Guest';

export interface DeliveryAddress {
  id: string;
  label: string; // 'Home' | 'Work' | 'Office' | 'Other'
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export interface UserReview {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  rating: number; // 1 to 5
  comment: string;
  sellerReply?: {
    text: string;
    repliedAt: string;
  };
  createdAt: string;
}

export interface UserReport {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  reportType: 'product' | 'seller' | 'delivery' | 'complaint';
  targetId?: string;
  targetName?: string;
  subject: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  receiverId?: string;
  recipientName: string;
  text: string;
  orderId?: string;
  read?: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roles?: UserRole[];
  avatar?: string;
  address?: string;
  city?: string;
  deliveryAddresses?: DeliveryAddress[];
  status: 'active' | 'suspended' | 'pending';
  verified: boolean;
  storeId?: string;
  vehicleType?: 'motorbike' | 'bicycle' | 'car' | 'van';
  licensePlate?: string;
  walletBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  discount?: string;
  image: string;
  images?: string[];
  category: string;
  description: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerLocation: string;
  sellerRating: number;
  condition: 'Brand New' | 'Refurbished' | 'Fair';
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'hidden';
  deliveryAvailable: boolean;
  createdAt: string;
  timer?: string;
  salesCount?: number;
  viewsCount?: number;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryMethod: 'Standard' | 'Express' | 'Pickup';
  paymentStatus: 'Paid' | 'Pending Cash on Delivery';
  paymentMethod?: string;
  buyerEmail?: string;
  orderStatus: OrderStatus;
  sellerId: string;
  sellerName: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    description: string;
  }[];
  createdAt: string;
  estimatedDelivery: string;
  rating?: number;
  issueReported?: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  amount: number;
  method: 'Orange Money' | 'Airtel Money' | 'Bank Transfer';
  accountNumber: string;
  accountName?: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  createdAt: string;
  paidAt?: string;
}

export interface Store {
  id: string;
  sellerId: string;
  sellerName?: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  category?: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  verified: boolean;
  rating: number;
  totalSales: number;
  totalProducts: number;
  documentUrl?: string;
  businessInfo?: string;
  rejectionReason?: string;
  createdAt?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    momoNumber?: string;
  };
}

export type RiderAvailability =
  | 'OFFLINE'
  | 'ONLINE'
  | 'AVAILABLE'
  | 'BUSY'
  | 'ON_DELIVERY'
  | 'SUSPENDED';

export type DeliveryStatus =
  | 'DELIVERY_ASSIGNED'
  | 'GOING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'ORDER_PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_AT_CUSTOMER'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'Available'
  | 'Accepted'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled'
  | 'Failed';

export interface RiderDelivery {
  id: string;
  orderId: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  pickupLocation: string;
  deliveryLocation: string;
  sellerId?: string;
  sellerName: string;
  sellerPhone: string;
  customerName: string; // Not exposing unnecessary private information
  customerPhone: string;
  packageDetails: string;
  itemsSummary?: string;
  totalOrderAmount?: number;
  deliveryFee: number;
  status: DeliveryStatus;
  deliveryOtp?: string; // 4-digit code provided to buyer upon ordering
  proofOfDeliveryPhoto?: string;
  proofNotes?: string;
  failureReason?: string;
  cancellationReason?: string;
  pickupTimestamp?: string;
  deliveredTimestamp?: string;
  timeline?: {
    status: string;
    timestamp: string;
    description?: string;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface RiderProfile {
  id: string;
  userId: string;
  fullName: string;
  profilePhoto?: string;
  phoneNumber: string;
  address: string;
  city: string;
  identificationType: 'National ID' | 'Passport' | 'Voter ID' | 'Driver License';
  idNumber: string;
  idDocumentUrl?: string;
  vehicleType: 'Motorcycle' | 'Bicycle' | 'Car' | 'Van';
  vehicleModel?: string;
  vehicleRegistrationNumber: string;
  vehicleRegistrationDocumentUrl?: string;
  driverLicenseNumber: string;
  driverLicenseDocumentUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'pending';
  availability: RiderAvailability;
  currentDeliveryId?: string | null;
  rating: number;
  totalDeliveries: number;
  activeSince?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RiderPayout {
  id: string;
  riderId: string;
  amount: number;
  method: 'Orange Money' | 'Afrimoney' | 'Bank Transfer';
  accountNumber: string;
  accountName?: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  createdAt: string;
  paidAt?: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  logo?: string;
  description: string;
  phone: string;
  email: string;
  location: string;
  website?: string;
  industry?: string;
  companySize?: string;
  companyInfo?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  documentUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  fullName: string;
  avatar?: string;
  title: string;
  category: string;
  skills: string[];
  experienceYears: number;
  experienceLevel: 'Entry' | 'Intermediate' | 'Expert';
  location: string;
  availability: 'Available Immediately' | 'Part-time' | 'Full-time' | 'Contract' | 'Not Available';
  bio: string;
  phone: string;
  email: string;
  hourlyRate?: number;
  resumeUrl?: string;
  rating?: number;
  completedJobs?: number;
  createdAt?: string;
}

export interface InterviewSchedule {
  id: string;
  employerId: string;
  employerName: string;
  applicationId: string;
  applicantId: string;
  applicantName: string;
  jobId: string;
  jobTitle: string;
  date: string;
  time: string;
  mode: 'In-person' | 'Virtual Call' | 'Phone';
  locationOrLink: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  title: string;
  category: string;
  type: 'Full-time' | 'Part-time' | 'Gig / Contract';
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: 'active' | 'closed' | 'pending' | 'draft';
  applicantCount: number;
  postedDate: string;
  featured?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  employerId?: string;
  applicantId: string;
  fullName: string;
  email: string;
  phone: string;
  coverNote: string;
  resumeSummary: string;
  resumeFileUrl?: string;
  status: 'Applied' | 'Reviewed' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Hired';
  appliedDate: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewNotes?: string;
  interviewLocation?: string;
  rating?: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  paymentMethod: string;
  transactionRef: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformComplaint {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  category: 'Delivery' | 'Seller' | 'Payment' | 'Product' | 'Other';
  relatedOrderId?: string;
  targetId?: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PlatformSettings {
  commissionRate: number; // e.g. 5%
  baseDeliveryFee: number; // e.g. Le 20
  requireSellerVerification: boolean;
  requireJobApproval: boolean;
  allowCashOnDelivery: boolean;
  supportPhone: string;
  supportEmail: string;
}

export interface UploadedFileItem {
  id: string;
  storagePath: string;
  downloadURL: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploadedAt: string;
  category?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'delivery' | 'job' | 'system' | 'promo';
  createdAt?: string;
  userId?: string;
}

// UI-only types (menus, feature tiles, onboarding)
export * from './ui';
