import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  playMessageSound,
  vibratePhone,
  showPhonePopUpNotification,
  requestNotificationPermission,
} from '../lib/notificationSounds';
import {
  User,
  UserRole,
  CanonicalRole,
  Product,
  Category,
  CartItem,
  Order,
  OrderStatus,
  Store,
  RiderDelivery,
  Job,
  JobApplication,
  AppNotification,
  PaymentRecord,
  AdminLog,
  AuditLog,
  PlatformComplaint,
  PlatformSettings,
  UploadedFileItem,
  DeliveryAddress,
  UserReview,
  UserReport,
  ChatMessage,
  SellerPayout,
  EmployerProfile,
  WorkerProfile,
  RiderProfile,
  RiderAvailability,
  DeliveryStatus,
  RiderPayout,
  InterviewSchedule,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORES,
  INITIAL_JOBS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_RIDER_DELIVERIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_REVIEWS,
  INITIAL_REPORTS,
  INITIAL_MESSAGES,
  INITIAL_PAYMENTS,
  INITIAL_PAYOUTS,
  INITIAL_WORKER_PROFILES,
  INITIAL_EMPLOYER_PROFILES,
  INITIAL_RIDER_PROFILES,
  INITIAL_INTERVIEWS,
  INITIAL_RIDER_PAYOUTS,
  SYSTEM_ADMIN_USER,
} from '../data/mockData';
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  FirebaseUser,
} from '../lib/firebase';
import { uploadAppFile, StorageCategory, UploadedFileMetadata } from '../lib/storage';
import { apiFetch } from '../lib/api';

interface AppContextType {
  currentPath: string;
  navigate: (path: string) => void;
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  userRole: UserRole;
  canonicalRole: CanonicalRole;
  userRoles: UserRole[];
  switchRole: (role: UserRole) => void;
  addRoleToUser: (newRole: UserRole) => Promise<boolean>;
  login: (email: string, role?: UserRole) => boolean;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<boolean>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    phone?: string
  ) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  sendVerificationEmail: () => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  users: User[];
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'pending', verified?: boolean) => Promise<void>;

  // Delivery Addresses Management
  deliveryAddresses: DeliveryAddress[];
  addDeliveryAddress: (address: Omit<DeliveryAddress, 'id'>) => Promise<void>;
  updateDeliveryAddress: (id: string, updates: Partial<DeliveryAddress>) => Promise<void>;
  deleteDeliveryAddress: (id: string) => Promise<void>;
  setDefaultDeliveryAddress: (id: string) => Promise<void>;

  // Categories & Products
  categories: Category[];
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  toggleProductStatus: (productId: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders & Deliveries
  orders: Order[];
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  assignRiderToOrder: (orderId: string, riderId: string, riderName: string, riderPhone: string) => Promise<void>;
  rateOrder: (orderId: string, rating: number) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  confirmOrderDelivery: (orderId: string) => Promise<void>;

  // Payments & Payouts
  payments: PaymentRecord[];
  payouts: SellerPayout[];
  requestPayout: (amount: number, method: SellerPayout['method'], accountNumber: string, accountName?: string) => Promise<void>;
  approvePayout: (payoutId: string) => Promise<void>;

  // Reviews & Feedback
  reviews: UserReview[];
  submitReview: (reviewData: Omit<UserReview, 'id' | 'createdAt'>) => Promise<void>;
  respondToReview: (reviewId: string, replyText: string) => Promise<void>;

  // Reports & Complaints
  reports: UserReport[];
  submitReport: (reportData: Omit<UserReport, 'id' | 'createdAt' | 'status'>) => Promise<void>;

  // Real-time Communication
  messages: ChatMessage[];
  sendMessage: (recipientId: string, recipientName: string, text: string, orderId?: string) => Promise<void>;
  activeChatRecipient: { id: string; name: string; avatar?: string; role?: string } | null;
  openChatWithUser: (userId: string, userName: string, avatar?: string, role?: string) => void;
  closeChatModal: () => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
  testNotificationAlert: () => Promise<void>;

  // Stores & Seller Application Flow
  stores: Store[];
  currentStore: Store | null;
  applyToBecomeSeller: (storeData: Partial<Store>) => Promise<Store>;
  approveSellerStore: (storeId: string) => Promise<void>;
  rejectSellerStore: (storeId: string, reason: string) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;

  // Rider & Courier Dispatch Fleet
  riderDeliveries: RiderDelivery[];
  riderOnline: boolean;
  toggleRiderOnline: () => void;
  acceptDelivery: (deliveryId: string) => Promise<void>;
  updateDeliveryStatus: (deliveryId: string, status: 'In Transit' | 'Delivered', photo?: string) => Promise<void>;
  riderProfiles: RiderProfile[];
  currentRiderProfile: RiderProfile | null;
  applyAsDispatchRider: (data: Partial<RiderProfile>) => Promise<RiderProfile>;
  approveRiderApplication: (riderId: string) => Promise<void>;
  rejectRiderApplication: (riderId: string, reason: string) => Promise<void>;
  updateRiderProfile: (riderId: string, updates: Partial<RiderProfile>) => Promise<void>;
  suspendRiderAccount: (riderId: string) => Promise<void>;
  activateRiderAccount: (riderId: string) => Promise<void>;
  setRiderAvailability: (status: RiderAvailability) => Promise<void>;
  acceptRiderDelivery: (deliveryId: string) => Promise<void>;
  declineRiderDelivery: (deliveryId: string) => Promise<void>;
  updateRiderDeliveryStatus: (
    deliveryId: string,
    newStatus: DeliveryStatus,
    details?: { failureReason?: string; cancellationReason?: string; proofPhoto?: string; proofNotes?: string; otpInput?: string }
  ) => Promise<boolean>;
  riderPayouts: RiderPayout[];
  requestRiderPayout: (amount: number, method: 'Orange Money' | 'Afrimoney' | 'Bank Transfer', accountNumber: string, accountName?: string) => Promise<void>;
  approveRiderPayout: (payoutId: string) => Promise<void>;
  orderReadyForPickup: (orderId: string) => Promise<void>;

  // Employer & Jobs Management
  jobs: Job[];
  applications: JobApplication[];
  employerProfiles: EmployerProfile[];
  currentEmployer: EmployerProfile | null;
  saveEmployerProfile: (data: Partial<EmployerProfile>) => Promise<EmployerProfile>;
  postJob: (jobData: Omit<Job, 'id' | 'applicantCount' | 'postedDate'>) => Promise<Job>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
  closeJob: (jobId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  applyForJob: (
    jobId: string,
    appData: {
      fullName: string;
      email: string;
      phone: string;
      coverNote: string;
      resumeSummary: string;
      resumeFileUrl?: string;
      employerId?: string;
      jobTitle?: string;
      companyName?: string;
    }
  ) => Promise<void>;
  updateApplicationStatus: (appId: string, status: JobApplication['status'], notes?: string, rating?: number) => Promise<void>;
  workerProfiles: WorkerProfile[];
  saveWorkerProfile: (data: Partial<WorkerProfile>) => Promise<WorkerProfile>;
  interviews: InterviewSchedule[];
  scheduleInterview: (details: Omit<InterviewSchedule, 'id' | 'createdAt' | 'status'>) => Promise<InterviewSchedule>;
  updateInterviewStatus: (interviewId: string, status: InterviewSchedule['status']) => Promise<void>;

  // Cloud Storage & Gemini AI
  uploadFile: (file: File, category: StorageCategory, entityId?: string, onProgress?: (p: number) => void) => Promise<UploadedFileMetadata>;
  generateAIDescription: (title: string, category?: string) => Promise<string>;
  analyzeImageWithAI: (imageUrl?: string, base64?: string) => Promise<any>;

  // Admin Platform Operations & Governance
  auditLogs: AuditLog[];
  recordAuditLog: (action: string, targetType: string, targetId: string, description: string, metadata?: Record<string, unknown>) => Promise<AuditLog>;
  updateUserRolePermissions: (userId: string, targetRole: 'SELLER' | 'EMPLOYER' | 'DISPATCH_RIDER', enable: boolean) => Promise<void>;
  setUserAccountStatus: (userId: string, status: 'active' | 'suspended' | 'pending', reason?: string) => Promise<void>;
  moderateProduct: (productId: string, action: 'approve' | 'reject' | 'hide' | 'unhide' | 'delete' | 'toggleFeatured', reason?: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'itemCount'>) => Promise<void>;
  deleteCategory: (catId: string) => Promise<void>;
  complaints: PlatformComplaint[];
  resolveComplaint: (complaintId: string, notes: string) => Promise<void>;
  submitComplaint: (data: Omit<PlatformComplaint, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  platformSettings: PlatformSettings;
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => Promise<void>;
  reassignDeliveryRider: (deliveryId: string, newRiderId: string, newRiderName: string, newRiderPhone?: string) => Promise<void>;
  adminCancelOrder: (orderId: string, reason: string) => Promise<void>;
  broadcastNotification: (target: 'all' | 'sellers' | 'riders' | 'employers' | string, title: string, message: string) => Promise<void>;
  resolveReport: (reportId: string, notes: string) => Promise<void>;

  // Feedback & UI
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const normalizeRole = (role?: string): CanonicalRole => {
  if (!role) return 'BUYER';
  const clean = String(role).toUpperCase().replace(/\s+/g, '_');
  if (clean === 'ADMIN') return 'ADMIN';
  if (clean === 'SELLER') return 'SELLER';
  if (clean === 'EMPLOYER') return 'EMPLOYER';
  if (clean === 'DISPATCH_RIDER' || clean === 'RIDER' || clean === 'DISPATCHER') return 'DISPATCH_RIDER';
  return 'BUYER';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      return window.location.pathname === '' ? '/' : window.location.pathname;
    }
    return '/';
  });

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Firebase Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jdmart_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // Synchronize Firebase Auth with Firestore User Document
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as User;
            const normRole = normalizeRole(data.role);
            const rolesList = data.roles && data.roles.length > 0 ? data.roles : [normRole];
            const updatedUser: User = { ...data, role: normRole, roles: rolesList };
            setCurrentUser(updatedUser);
            localStorage.setItem('jdmart_current_user', JSON.stringify(updatedUser));
          } else {
            // First time login via provider or fallback
            const isAdmin =
              fbUser.email === 'dalabapays@gmail.com' ||
              fbUser.email === 'admin@jdmart.sl' ||
              fbUser.email === 'admin@jdmart.com';
            const canonical: CanonicalRole = isAdmin ? 'ADMIN' : 'BUYER';
            const rolesList: UserRole[] = isAdmin
              ? ['ADMIN', 'BUYER', 'SELLER', 'EMPLOYER', 'DISPATCH_RIDER']
              : ['BUYER'];
            const defaultAddr: DeliveryAddress = {
              id: 'addr-default-1',
              label: 'Home',
              recipientName: fbUser.displayName || 'Customer',
              phone: fbUser.phoneNumber || '+232 77 000000',
              street: '15 Campbell Street',
              city: 'Freetown',
              notes: 'Near Siaka Stevens Stadium',
              isDefault: true,
            };
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '+232 77 000000',
              role: canonical,
              roles: rolesList,
              deliveryAddresses: [defaultAddr],
              avatar: fbUser.photoURL || '/assets/icons/account.gif',
              status: 'active',
              verified: fbUser.emailVerified || false,
              walletBalance: 0,
            };
            await setDoc(userDocRef, {
              ...newUser,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setCurrentUser(newUser);
            localStorage.setItem('jdmart_current_user', JSON.stringify(newUser));
          }
        } catch (error) {
          console.warn('Firestore user profile fetch error:', error);
        }
      } else {
        // Not authenticated in Firebase Auth
        const saved = localStorage.getItem('jdmart_current_user');
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const userRole: UserRole = currentUser ? currentUser.role : 'Guest';
  const canonicalRole: CanonicalRole = currentUser ? normalizeRole(currentUser.role) : 'BUYER';
  const userRoles: UserRole[] = currentUser?.roles && currentUser.roles.length > 0
    ? currentUser.roles
    : currentUser
    ? [currentUser.role]
    : ['BUYER'];

  // Default fallback address for buyer
  const defaultDeliveryAddress: DeliveryAddress = {
    id: 'addr-default-1',
    label: 'Home',
    recipientName: currentUser?.name || 'Customer',
    phone: currentUser?.phone || '+232 77 000000',
    street: currentUser?.address || '15 Campbell Street',
    city: currentUser?.city || 'Freetown',
    notes: 'Near Siaka Stevens Stadium',
    isDefault: true,
  };

  const deliveryAddresses: DeliveryAddress[] =
    currentUser?.deliveryAddresses && currentUser.deliveryAddresses.length > 0
      ? currentUser.deliveryAddresses
      : [defaultDeliveryAddress];

  // Firestore Real-Time Listeners
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('jdmart_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('jdmart_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'audit-init-1',
        adminId: 'admin-master',
        adminName: 'Platform Director',
        action: 'ADMIN_APPROVED_SELLER',
        targetType: 'Store',
        targetId: 'store-1',
        description: 'Approved vendor registration for Salone Electronics Hub.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'audit-init-2',
        adminId: 'admin-master',
        adminName: 'Platform Director',
        action: 'ADMIN_APPROVED_RIDER',
        targetType: 'Rider',
        targetId: 'rider-demo-1',
        description: 'Verified commercial license and approved courier Samuel Bangura.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'audit-init-3',
        adminId: 'admin-master',
        adminName: 'Platform Director',
        action: 'ADMIN_CHANGED_USER_ROLES',
        targetType: 'User',
        targetId: 'user-seller-1',
        description: 'Granted SELLER permissions to store administrator.',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
    ];
  });

  const [complaints, setComplaints] = useState<PlatformComplaint[]>(() => {
    const saved = localStorage.getItem('jdmart_complaints');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'cmp-101',
        userId: 'buyer-demo-1',
        userName: 'Fatmata Sesay',
        category: 'Delivery',
        relatedOrderId: 'JDM-84920',
        subject: 'Delayed courier delivery to Wilberforce',
        description: 'Rider was delayed due to heavy rain on main motor road.',
        priority: 'Medium',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'cmp-102',
        userId: 'buyer-demo-2',
        userName: 'Mohamed Koroma',
        category: 'Product',
        subject: 'Inquiry regarding warranty for smartwatch',
        description: 'Buyer requested verification of official 12-month distributor warranty.',
        priority: 'Low',
        status: 'Resolved',
        resolutionNotes: 'Merchant provided warranty card and receipt.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date(Date.now() - 43200000).toISOString(),
      },
    ];
  });

  const defaultPlatformSettings: PlatformSettings = {
    commissionRate: 5,
    baseDeliveryFee: 20,
    requireSellerVerification: true,
    requireJobApproval: true,
    allowCashOnDelivery: true,
    supportPhone: '+232 76 123456',
    supportEmail: 'admin@jdmart.sl',
  };

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('jdmart_platform_settings');
    return saved ? JSON.parse(saved) : defaultPlatformSettings;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('jdmart_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('jdmart_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('jdmart_stores');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('jdmart_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('jdmart_applications');
    return saved ? JSON.parse(saved) : [];
  });
  const [riderDeliveries, setRiderDeliveries] = useState<RiderDelivery[]>(() => {
    const saved = localStorage.getItem('jdmart_rider_deliveries');
    return saved ? JSON.parse(saved) : INITIAL_RIDER_DELIVERIES;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('jdmart_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [reviews, setReviews] = useState<UserReview[]>(() => {
    const saved = localStorage.getItem('jdmart_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });
  const [reports, setReports] = useState<UserReport[]>(() => {
    const saved = localStorage.getItem('jdmart_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('jdmart_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [activeChatRecipient, setActiveChatRecipient] = useState<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  } | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const openChatWithUser = (
    userId: string,
    userName: string,
    avatar?: string,
    role?: string
  ) => {
    setActiveChatRecipient({ id: userId, name: userName, avatar, role });
    setIsChatDrawerOpen(true);
  };

  const closeChatModal = () => {
    setActiveChatRecipient(null);
  };

  const testNotificationAlert = async () => {
    await requestNotificationPermission();
    showPhonePopUpNotification(
      '💬 JD Mart Alert Notification',
      'Test notification sound and phone vibration triggered successfully!',
      {
        tag: `test-${Date.now()}`,
      }
    );
    showToast('Alert sound and phone pop-up notification triggered!');
  };
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('jdmart_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [payouts, setPayouts] = useState<SellerPayout[]>(() => {
    const saved = localStorage.getItem('jdmart_payouts');
    return saved ? JSON.parse(saved) : INITIAL_PAYOUTS;
  });
  const [employerProfiles, setEmployerProfiles] = useState<EmployerProfile[]>(() => {
    const saved = localStorage.getItem('jdmart_employer_profiles');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYER_PROFILES;
  });
  const [workerProfiles, setWorkerProfiles] = useState<WorkerProfile[]>(() => {
    const saved = localStorage.getItem('jdmart_worker_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(
            (w: WorkerProfile) =>
              !['worker-1', 'worker-2', 'worker-3', 'worker-4', 'worker-5'].includes(w.id) &&
              !w.userId?.startsWith('user-w')
          );
          localStorage.setItem('jdmart_worker_profiles', JSON.stringify(realOnly));
          return realOnly;
        }
      } catch {
        return [];
      }
    }
    return INITIAL_WORKER_PROFILES;
  });
  const [riderProfiles, setRiderProfiles] = useState<RiderProfile[]>(() => {
    const saved = localStorage.getItem('jdmart_rider_profiles');
    return saved ? JSON.parse(saved) : INITIAL_RIDER_PROFILES;
  });
  const [interviews, setInterviews] = useState<InterviewSchedule[]>(() => {
    const saved = localStorage.getItem('jdmart_interviews');
    return saved ? JSON.parse(saved) : INITIAL_INTERVIEWS;
  });
  const [riderPayouts, setRiderPayouts] = useState<RiderPayout[]>(() => {
    const saved = localStorage.getItem('jdmart_rider_payouts');
    return saved ? JSON.parse(saved) : INITIAL_RIDER_PAYOUTS;
  });

  // Current Store for logged in Seller
  const currentStore: Store | null =
    stores.find((s) => s.sellerId === currentUser?.id || s.id === currentUser?.storeId) || null;

  // Current Employer for logged in User
  const currentEmployer: EmployerProfile | null =
    employerProfiles.find((e) => e.userId === currentUser?.id) || null;

  // Current Rider Profile for logged in Courier
  const currentRiderProfile: RiderProfile | null =
    riderProfiles.find((r) => r.userId === currentUser?.id) || null;

  // 1. Public Real-time Firestore sync subscriptions (Products, Jobs, Reviews, Stores)
  useEffect(() => {
    let unsubProducts = () => {};
    let unsubJobs = () => {};
    let unsubReviews = () => {};
    let unsubStores = () => {};

    try {
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          const items: Product[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Product));
          if (items.length > 0) {
            setProducts(items);
            localStorage.setItem('jdmart_products', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore products public sync notice:', error.message);
        }
      );

      unsubJobs = onSnapshot(
        collection(db, 'jobs'),
        (snapshot) => {
          const items: Job[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Job));
          if (items.length > 0) {
            setJobs(items);
            localStorage.setItem('jdmart_jobs', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore jobs public sync notice:', error.message);
        }
      );

      unsubReviews = onSnapshot(
        collection(db, 'reviews'),
        (snapshot) => {
          const items: UserReview[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as UserReview));
          if (items.length > 0) {
            setReviews(items);
            localStorage.setItem('jdmart_reviews', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore reviews public sync notice:', error.message);
        }
      );

      unsubStores = onSnapshot(
        collection(db, 'stores'),
        (snapshot) => {
          const items: Store[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Store));
          if (items.length > 0) {
            setStores(items);
            localStorage.setItem('jdmart_stores', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore stores public sync notice:', error.message);
        }
      );

      let unsubEmployerProfiles = () => {};
      let unsubWorkerProfiles = () => {};

      unsubEmployerProfiles = onSnapshot(
        collection(db, 'employerProfiles'),
        (snapshot) => {
          const items: EmployerProfile[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as EmployerProfile));
          if (items.length > 0) {
            setEmployerProfiles(items);
            localStorage.setItem('jdmart_employer_profiles', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore employer profiles sync notice:', error.message);
        }
      );

      unsubWorkerProfiles = onSnapshot(
        collection(db, 'workerProfiles'),
        (snapshot) => {
          const items: WorkerProfile[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as WorkerProfile));
          if (items.length > 0) {
            setWorkerProfiles(items);
            localStorage.setItem('jdmart_worker_profiles', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Firestore worker profiles sync notice:', error.message);
        }
      );

      return () => {
        unsubProducts();
        unsubJobs();
        unsubReviews();
        unsubStores();
        unsubEmployerProfiles();
        unsubWorkerProfiles();
      };
    } catch (e) {
      console.warn('Public collections snapshot setup notice:', e);
    }
  }, []);

  // 2. Authenticated Real-time Firestore sync subscriptions
  useEffect(() => {
    // Only attach authenticated snapshot listeners if auth is ready and user is signed in
    if (authLoading || !firebaseUser) {
      return;
    }

    const unsubs: (() => void)[] = [];
    const uid = firebaseUser.uid;
    const email = firebaseUser.email || '';
    const isAdminUser =
      email === 'dalabapays@gmail.com' ||
      email === 'admin@jdmart.sl' ||
      email === 'admin@jdmart.com' ||
      currentUser?.role === 'admin';

    try {
      // 1. Orders
      if (isAdminUser) {
        const unsub = onSnapshot(
          collection(db, 'orders'),
          (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Order));
            if (items.length > 0) {
              setOrders(items);
              localStorage.setItem('jdmart_orders', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn('Admin orders sync notice:', error.message);
          }
        );
        unsubs.push(unsub);
      } else {
        const userRoleNorm = (currentUser?.role || '').toLowerCase();
        let ordersQuery;
        if (userRoleNorm === 'seller') {
          ordersQuery = query(collection(db, 'orders'), where('sellerId', '==', uid));
        } else if (userRoleNorm === 'dispatcher' || userRoleNorm === 'rider') {
          ordersQuery = query(collection(db, 'orders'), where('riderId', '==', uid));
        } else {
          ordersQuery = query(collection(db, 'orders'), where('buyerId', '==', uid));
        }

        const unsub = onSnapshot(
          ordersQuery,
          (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Order));
            if (items.length > 0) {
              setOrders(items);
              localStorage.setItem('jdmart_orders', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn('User orders sync notice:', error.message);
          }
        );
        unsubs.push(unsub);
      }

      // 2. Deliveries (Admins or Couriers)
      if (isAdminUser || ['dispatcher', 'rider'].includes((currentUser?.role || '').toLowerCase())) {
        const unsub = onSnapshot(
          collection(db, 'deliveries'),
          (snapshot) => {
            const items: RiderDelivery[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as RiderDelivery));
            if (items.length > 0) {
              setRiderDeliveries(items);
              localStorage.setItem('jdmart_rider_deliveries', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn('Deliveries sync notice:', error.message);
          }
        );
        unsubs.push(unsub);
      }

      // 3. Users Directory (Admin Only)
      if (isAdminUser) {
        const unsub = onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const items: User[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as User));
            if (items.length > 0) {
              setUsers(items);
              localStorage.setItem('jdmart_users', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn('Admin users directory sync notice:', error.message);
          }
        );
        unsubs.push(unsub);
      }

      // 4. Notifications (User Scoped)
      const notifQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
      const unsubNotif = onSnapshot(
        notifQuery,
        (snapshot) => {
          const items: AppNotification[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as AppNotification));
          if (items.length > 0) {
            setNotifications(items);
            localStorage.setItem('jdmart_notifications', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Notifications sync notice:', error.message);
        }
      );
      unsubs.push(unsubNotif);

      // 5. Applications (Employer and Candidate Sync from 'job_applications' collection)
      if (isAdminUser) {
        const unsubApp = onSnapshot(
          collection(db, 'job_applications'),
          (snapshot) => {
            const items: JobApplication[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as JobApplication));
            if (items.length > 0) {
              setApplications(items);
              localStorage.setItem('jdmart_applications', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn("Admin 'job_applications' sync notice:", error.message);
          }
        );
        unsubs.push(unsubApp);
      } else {
        let applicantApps: JobApplication[] = [];
        let employerApps: JobApplication[] = [];

        const updateMergedApps = () => {
          const map = new Map<string, JobApplication>();
          applicantApps.forEach((a) => map.set(a.id, a));
          employerApps.forEach((a) => map.set(a.id, a));
          const merged = Array.from(map.values());
          if (merged.length > 0) {
            setApplications(merged);
            localStorage.setItem('jdmart_applications', JSON.stringify(merged));
          }
        };

        const appQuery = query(collection(db, 'job_applications'), where('applicantId', '==', uid));
        const unsubApp = onSnapshot(
          appQuery,
          (snapshot) => {
            applicantApps = [];
            snapshot.forEach((d) => applicantApps.push({ id: d.id, ...d.data() } as JobApplication));
            updateMergedApps();
          },
          (error) => {
            console.warn("User 'job_applications' sync notice:", error.message);
          }
        );
        unsubs.push(unsubApp);

        const empAppQuery = query(collection(db, 'job_applications'), where('employerId', '==', uid));
        const unsubEmpApp = onSnapshot(
          empAppQuery,
          (snapshot) => {
            employerApps = [];
            snapshot.forEach((d) => employerApps.push({ id: d.id, ...d.data() } as JobApplication));
            updateMergedApps();
          },
          (error) => {
            console.warn("Employer 'job_applications' sync notice:", error.message);
          }
        );
        unsubs.push(unsubEmpApp);
      }

      // 6. Payments (User Scoped or Admin)
      const payQuery = isAdminUser
        ? collection(db, 'payments')
        : query(collection(db, 'payments'), where('userId', '==', uid));
      const unsubPay = onSnapshot(
        payQuery,
        (snapshot) => {
          const items: PaymentRecord[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as PaymentRecord));
          if (items.length > 0) {
            setPayments(items);
            localStorage.setItem('jdmart_payments', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Payments sync notice:', error.message);
        }
      );
      unsubs.push(unsubPay);

      // 7. Reports (Buyer Scoped or Admin)
      const repQuery = isAdminUser
        ? collection(db, 'reports')
        : query(collection(db, 'reports'), where('buyerId', '==', uid));
      const unsubRep = onSnapshot(
        repQuery,
        (snapshot) => {
          const items: UserReport[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as UserReport));
          if (items.length > 0) {
            setReports(items);
            localStorage.setItem('jdmart_reports', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Reports sync notice:', error.message);
        }
      );
      unsubs.push(unsubRep);

      // 8. Messages (Real-time Chat with Sound & Phone Pop-up Notifications)
      let initialMsgSync = true;
      const seenMsgIds = new Set<string>();

      const unsubMsg = onSnapshot(
        collection(db, 'messages'),
        (snapshot) => {
          const items: ChatMessage[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as ChatMessage;
            if (isAdminUser || data.senderId === uid || data.recipientId === uid || data.receiverId === uid) {
              const msgItem = { id: d.id, ...data };
              items.push(msgItem);

              if (!initialMsgSync && !seenMsgIds.has(d.id)) {
                if ((data.recipientId === uid || data.receiverId === uid) && data.senderId !== uid) {
                  // Trigger sound chime, phone vibration, and system pop-up notification
                  showPhonePopUpNotification(
                    `💬 ${data.senderName || 'New Message'} on JD Mart`,
                    data.text,
                    {
                      tag: `msg-${d.id}`,
                      onClick: () => {
                        openChatWithUser(data.senderId, data.senderName);
                      },
                    }
                  );

                  // Create in-app notification
                  const notifId = `notif-msg-${d.id}`;
                  const chatNotif: AppNotification = {
                    id: notifId,
                    userId: uid,
                    title: `New Message from ${data.senderName}`,
                    message: data.text,
                    time: 'Just now',
                    type: 'system',
                    read: false,
                    createdAt: new Date().toISOString(),
                  };
                  setNotifications((prev) => [chatNotif, ...prev.filter((n) => n.id !== notifId)]);
                }
              }
              seenMsgIds.add(d.id);
            }
          });

          initialMsgSync = false;
          if (items.length > 0) {
            setMessages(items);
            localStorage.setItem('jdmart_messages', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Messages sync notice:', error.message);
        }
      );
      unsubs.push(unsubMsg);

      // 9. Payouts (Seller Scoped or Admin)
      const payoutQuery = isAdminUser
        ? collection(db, 'payouts')
        : query(collection(db, 'payouts'), where('sellerId', '==', uid));
      const unsubPayout = onSnapshot(
        payoutQuery,
        (snapshot) => {
          const items: SellerPayout[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as SellerPayout));
          if (items.length > 0) {
            setPayouts(items);
            localStorage.setItem('jdmart_payouts', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Payouts sync notice:', error.message);
        }
      );
      unsubs.push(unsubPayout);

      // 10. Rider Profiles (Admin or Rider)
      const riderQuery = isAdminUser
        ? collection(db, 'riderProfiles')
        : query(collection(db, 'riderProfiles'), where('userId', '==', uid));
      const unsubRiders = onSnapshot(
        riderQuery,
        (snapshot) => {
          const items: RiderProfile[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as RiderProfile));
          if (items.length > 0) {
            setRiderProfiles((prev) => {
              const ids = new Set(items.map((i) => i.id));
              const merged = [...items, ...prev.filter((p) => !ids.has(p.id))];
              localStorage.setItem('jdmart_rider_profiles', JSON.stringify(merged));
              return merged;
            });
          }
        },
        (error) => {
          console.warn('Rider profiles sync notice:', error.message);
        }
      );
      unsubs.push(unsubRiders);

      // 11. Interviews (Employer or Applicant or Admin)
      const unsubInterviews = onSnapshot(
        collection(db, 'interviews'),
        (snapshot) => {
          const items: InterviewSchedule[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as InterviewSchedule;
            if (isAdminUser || data.employerId === uid || data.applicantId === uid) {
              items.push({ id: d.id, ...data });
            }
          });
          if (items.length > 0) {
            setInterviews(items);
            localStorage.setItem('jdmart_interviews', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Interviews sync notice:', error.message);
        }
      );
      unsubs.push(unsubInterviews);

      // 12. Rider Payouts (Rider or Admin)
      const riderPayoutQuery = isAdminUser
        ? collection(db, 'riderPayouts')
        : query(collection(db, 'riderPayouts'), where('riderId', '==', uid));
      const unsubRiderPayouts = onSnapshot(
        riderPayoutQuery,
        (snapshot) => {
          const items: RiderPayout[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as RiderPayout));
          if (items.length > 0) {
            setRiderPayouts(items);
            localStorage.setItem('jdmart_rider_payouts', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Rider payouts sync notice:', error.message);
        }
      );
      unsubs.push(unsubRiderPayouts);

      // 13. Audit Logs (Admin Only)
      if (isAdminUser) {
        const unsubAudit = onSnapshot(
          collection(db, 'auditLogs'),
          (snapshot) => {
            const items: AuditLog[] = [];
            snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as AuditLog));
            if (items.length > 0) {
              items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setAuditLogs(items);
              localStorage.setItem('jdmart_audit_logs', JSON.stringify(items));
            }
          },
          (error) => {
            console.warn('Audit logs sync notice:', error.message);
          }
        );
        unsubs.push(unsubAudit);
      }

      // 14. Complaints (Admin or Submitter)
      const complaintQuery = isAdminUser
        ? collection(db, 'complaints')
        : query(collection(db, 'complaints'), where('userId', '==', uid));
      const unsubComplaints = onSnapshot(
        complaintQuery,
        (snapshot) => {
          const items: PlatformComplaint[] = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as PlatformComplaint));
          if (items.length > 0) {
            setComplaints(items);
            localStorage.setItem('jdmart_complaints', JSON.stringify(items));
          }
        },
        (error) => {
          console.warn('Complaints sync notice:', error.message);
        }
      );
      unsubs.push(unsubComplaints);
    } catch (e) {
      console.warn('Authenticated snapshot listeners setup error:', e);
    }

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, [authLoading, firebaseUser, currentUser?.role]);

  // Role Redirection Helper
  const redirectAfterLogin = (role: UserRole) => {
    const r = (role || 'buyer').toLowerCase();
    if (r === 'admin') navigate('/admin');
    else if (r === 'seller') navigate('/seller');
    else if (r === 'dispatcher' || r === 'rider') navigate('/rider');
    else if (r === 'employer') navigate('/employer');
    else if (r === 'employee' || r === 'job seeker') navigate('/job-seeker/dashboard');
    else navigate('/dashboard');
  };

  // Authentication Methods
  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'buyer',
    phone: string = '+232 76 000000'
  ): Promise<boolean> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isAdminAccount =
        cleanEmail === 'dalabapays@gmail.com' ||
        cleanEmail === 'admin@jdmart.sl' ||
        cleanEmail === 'admin@jdmart.com';

      let assignedRole = normalizeRole(role);
      if (assignedRole === 'ADMIN' && !isAdminAccount) {
        showToast('Administrator role cannot be self-assigned. Defaulted to BUYER.');
        assignedRole = 'BUYER';
      }

      const assignedRoles: UserRole[] = isAdminAccount
        ? ['ADMIN', 'BUYER', 'SELLER', 'EMPLOYER', 'DISPATCH_RIDER']
        : assignedRole === 'SELLER'
        ? ['BUYER', 'SELLER']
        : assignedRole === 'EMPLOYER'
        ? ['BUYER', 'EMPLOYER']
        : assignedRole === 'DISPATCH_RIDER'
        ? ['BUYER', 'DISPATCH_RIDER']
        : ['BUYER'];

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: name });

      const defaultAddr: DeliveryAddress = {
        id: `addr-${Date.now()}`,
        label: 'Home',
        recipientName: name,
        phone,
        street: '15 Campbell Street',
        city: 'Freetown',
        notes: 'Near Siaka Stevens Stadium',
        isDefault: true,
      };

      const newUser: User = {
        id: cred.user.uid,
        name,
        email: cleanEmail,
        phone,
        role: assignedRole,
        roles: assignedRoles,
        deliveryAddresses: [defaultAddr],
        avatar: '/assets/icons/account.gif',
        status: 'active',
        verified: false,
        walletBalance: 0,
      };

      await setDoc(doc(db, 'users', cred.user.uid), {
        ...newUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setCurrentUser(newUser);
      localStorage.setItem('jdmart_current_user', JSON.stringify(newUser));

      // Trigger Welcome Email
      apiFetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          to: cleanEmail,
          recipientName: name,
          role: assignedRole,
        }),
      }).catch((e) => console.warn('Welcome email error:', e));

      showToast(`Account successfully registered as ${assignedRole}!`);
      // Trigger Verification Email
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Auto verification notice:', e);
      }
      redirectAfterLogin(assignedRole);
      return true;
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please log in instead.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      } else {
        msg = msg.replace('Firebase: ', '').replace('Error (', '').replace(').', '');
      }
      showToast(msg);
      return false;
    }
  };

  const loginWithGoogle = async (preferredRole: UserRole = 'BUYER'): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      let userData: User;
      if (snap.exists()) {
        const data = snap.data() as User;
        const normRole = normalizeRole(data.role);
        const rolesList = data.roles && data.roles.length > 0 ? data.roles : [normRole];
        userData = { ...data, role: normRole, roles: rolesList };
      } else {
        const isAdmin =
          fbUser.email === 'dalabapays@gmail.com' ||
          fbUser.email === 'admin@jdmart.sl' ||
          fbUser.email === 'admin@jdmart.com';
        const roleNormalized: CanonicalRole = isAdmin ? 'ADMIN' : normalizeRole(preferredRole);
        const initialRoles: UserRole[] = isAdmin
          ? ['ADMIN', 'BUYER', 'SELLER', 'EMPLOYER', 'DISPATCH_RIDER']
          : roleNormalized === 'SELLER'
          ? ['BUYER', 'SELLER']
          : roleNormalized === 'EMPLOYER'
          ? ['BUYER', 'EMPLOYER']
          : roleNormalized === 'DISPATCH_RIDER'
          ? ['BUYER', 'DISPATCH_RIDER']
          : ['BUYER'];

        const defaultAddr: DeliveryAddress = {
          id: `addr-${Date.now()}`,
          label: 'Home',
          recipientName: fbUser.displayName || 'Customer',
          phone: fbUser.phoneNumber || '+232 77 000000',
          street: '15 Campbell Street',
          city: 'Freetown',
          notes: 'Near Siaka Stevens Stadium',
          isDefault: true,
        };

        userData = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '+232 77 000000',
          role: roleNormalized,
          roles: initialRoles,
          deliveryAddresses: [defaultAddr],
          avatar: fbUser.photoURL || '/assets/icons/account.gif',
          status: 'active',
          verified: fbUser.emailVerified || false,
          walletBalance: 0,
        };
        await setDoc(userDocRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Trigger Welcome Email
        apiFetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            to: userData.email,
            recipientName: userData.name,
            role: userData.role,
          }),
        }).catch(() => {});
      }
      setCurrentUser(userData);
      localStorage.setItem('jdmart_current_user', JSON.stringify(userData));
      showToast(`Signed in with Google as ${userData.name}!`);
      redirectAfterLogin(userData.role);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in error';
      showToast(msg.replace('Firebase: ', ''));
      return false;
    }
  };

  const sendVerificationEmail = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      showToast('Please sign in to verify your email address.');
      return false;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      showToast(`Verification link sent to ${auth.currentUser.email}`);
      // Server-side notification backup
      apiFetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email_verification',
          to: auth.currentUser.email,
          recipientName: currentUser?.name || 'Member',
        }),
      }).catch(() => {});
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification';
      showToast(msg.replace('Firebase: ', ''));
      return false;
    }
  };

  const loginWithEmail = async (email: string, password = 'password123'): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // Administrator Direct Authentication
    if (cleanEmail === 'admin@jdmart.sl' || cleanEmail === 'admin@jdmart.com') {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (userDoc.exists()) {
          const adminData = userDoc.data() as User;
          setCurrentUser(adminData);
          localStorage.setItem('jdmart_current_user', JSON.stringify(adminData));
        } else {
          const adminObj: User = { ...SYSTEM_ADMIN_USER, id: cred.user.uid, role: 'admin' };
          await setDoc(doc(db, 'users', cred.user.uid), adminObj);
          setCurrentUser(adminObj);
          localStorage.setItem('jdmart_current_user', JSON.stringify(adminObj));
        }
      } catch {
        // If not in Firebase Auth, provision document
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const adminObj: User = { ...SYSTEM_ADMIN_USER, id: cred.user.uid, role: 'admin' };
          await setDoc(doc(db, 'users', cred.user.uid), adminObj);
          setCurrentUser(adminObj);
          localStorage.setItem('jdmart_current_user', JSON.stringify(adminObj));
        } catch {
          setCurrentUser(SYSTEM_ADMIN_USER);
          localStorage.setItem('jdmart_current_user', JSON.stringify(SYSTEM_ADMIN_USER));
        }
      }
      showToast('Logged in as Administrator');
      navigate('/admin');
      return true;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as User;
        setCurrentUser(u);
        localStorage.setItem('jdmart_current_user', JSON.stringify(u));
        showToast(`Welcome back, ${u.name}!`);
        redirectAfterLogin(u.role);
        return true;
      } else {
        const defaultAddr: DeliveryAddress = {
          id: 'addr-default-1',
          label: 'Home',
          recipientName: cred.user.displayName || 'Customer',
          phone: cred.user.phoneNumber || '+232 77 000000',
          street: '15 Campbell Street',
          city: 'Freetown',
          notes: 'Near Siaka Stevens Stadium',
          isDefault: true,
        };
        const newUser: User = {
          id: cred.user.uid,
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          email: cleanEmail,
          phone: cred.user.phoneNumber || '+232 77 000000',
          role: 'BUYER',
          roles: ['BUYER'],
          deliveryAddresses: [defaultAddr],
          avatar: cred.user.photoURL || '/assets/icons/account.gif',
          status: 'active',
          verified: cred.user.emailVerified || false,
          walletBalance: 0,
        };
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...newUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setCurrentUser(newUser);
        localStorage.setItem('jdmart_current_user', JSON.stringify(newUser));
        showToast(`Welcome, ${newUser.name}!`);
        redirectAfterLogin('BUYER');
        return true;
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'Invalid email or password. Please verify your credentials or register a new account.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Access temporarily restricted due to many failed attempts. Please reset your password or try again later.';
      } else {
        msg = msg.replace('Firebase: ', '').replace('Error (', '').replace(').', '');
      }
      showToast(msg);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      showToast('Password reset link sent to your email.');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset';
      showToast(msg.replace('Firebase: ', ''));
      return false;
    }
  };

  const login = (email: string, role?: UserRole) => {
    loginWithEmail(email).catch(() => {});
    return true;
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('jdmart_current_user');
    showToast('You have been signed out.');
    navigate('/');
  };

  const switchRole = (role: UserRole) => {
    if (role === 'Guest') {
      logout();
      return;
    }
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      localStorage.setItem('jdmart_current_user', JSON.stringify(updated));
      showToast(`Switched active workspace to: ${role}`);
      redirectAfterLogin(role);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('jdmart_current_user', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore profile update sync:', e);
    }
    showToast('Profile updated successfully');
  };

  const updateUserStatus = async (
    userId: string,
    status: 'active' | 'suspended' | 'pending',
    verified?: boolean
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, status, ...(verified !== undefined ? { verified } : {}) };
        }
        return u;
      })
    );

    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        ...(verified !== undefined ? { verified } : {}),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore user status sync:', e);
    }
    showToast(`User status updated to ${status}`);
  };

  const addRoleToUser = async (newRole: UserRole): Promise<boolean> => {
    const norm = normalizeRole(newRole);
    if (norm === 'ADMIN') {
      showToast('Unauthorized: Administrator privilege cannot be self-assigned.');
      return false;
    }
    if (!currentUser) {
      showToast('Please sign in to add a role');
      return false;
    }
    const currentRoles = (currentUser.roles || [currentUser.role]).map((r) => normalizeRole(r));
    if (currentRoles.includes(norm)) {
      showToast(`Your account already has the ${norm} role.`);
      return true;
    }
    const updatedRoles = [...currentRoles, norm];
    const updatedUser: User = {
      ...currentUser,
      roles: updatedRoles,
      role: norm,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('jdmart_current_user', JSON.stringify(updatedUser));
    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        roles: updatedRoles,
        role: norm,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore user roles sync error:', err);
    }
    showToast(`Added ${norm} role! Switched active view to ${norm}.`);
    redirectAfterLogin(norm);
    return true;
  };

  // Delivery Addresses Management
  const addDeliveryAddress = async (addr: Omit<DeliveryAddress, 'id'>) => {
    if (!currentUser) return;
    const newAddr: DeliveryAddress = {
      ...addr,
      id: `addr-${Date.now()}`,
    };
    let updatedList = [...deliveryAddresses];
    if (newAddr.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }
    updatedList.push(newAddr);
    await updateUserProfile({
      deliveryAddresses: updatedList,
      address: newAddr.isDefault ? `${newAddr.street}, ${newAddr.city}` : currentUser.address,
      city: newAddr.isDefault ? newAddr.city : currentUser.city,
    });
    showToast(`Delivery address "${newAddr.label}" added!`);
  };

  const updateDeliveryAddress = async (id: string, updates: Partial<DeliveryAddress>) => {
    if (!currentUser) return;
    let updatedList = deliveryAddresses.map((a) => (a.id === id ? { ...a, ...updates } : a));
    if (updates.isDefault) {
      updatedList = updatedList.map((a) => (a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
    }
    await updateUserProfile({ deliveryAddresses: updatedList });
    showToast('Delivery address updated!');
  };

  const deleteDeliveryAddress = async (id: string) => {
    if (!currentUser) return;
    const updatedList = deliveryAddresses.filter((a) => a.id !== id);
    await updateUserProfile({ deliveryAddresses: updatedList });
    showToast('Delivery address removed');
  };

  const setDefaultDeliveryAddress = async (id: string) => {
    if (!currentUser) return;
    const target = deliveryAddresses.find((a) => a.id === id);
    const updatedList = deliveryAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await updateUserProfile({
      deliveryAddresses: updatedList,
      ...(target ? { address: `${target.street}, ${target.city}`, city: target.city } : {}),
    });
    showToast(`Default delivery address set to ${target?.label || 'selected address'}`);
  };

  // Order Receipt Confirmation
  const confirmOrderDelivery = async (orderId: string) => {
    await updateOrderStatus(orderId, 'Delivered', 'Order receipt confirmed by customer. Payment released from escrow.');
    showToast(`Delivery confirmed for Order #${orderId}. Thank you!`);
  };

  // Reviews & Rating
  const submitReview = async (reviewData: Omit<UserReview, 'id' | 'createdAt'>) => {
    const id = `rev-${Date.now()}`;
    const newRev: UserReview = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newRev, ...prev]);
    localStorage.setItem('jdmart_reviews', JSON.stringify([newRev, ...reviews]));

    try {
      await setDoc(doc(db, 'reviews', id), newRev);
      const prod = products.find((p) => p.id === reviewData.productId);
      if (prod) {
        const prodReviews = [newRev, ...reviews.filter((r) => r.productId === prod.id)];
        const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
        await updateProduct(prod.id, {
          rating: Number(avg.toFixed(1)),
          reviewsCount: prodReviews.length,
        });
      }
    } catch (err) {
      console.warn('Firestore review creation error:', err);
    }
    showToast('Review submitted in real-time! Thank you for your feedback.');
  };

  // Reports & Complaints
  const submitReport = async (reportData: Omit<UserReport, 'id' | 'createdAt' | 'status'>) => {
    const id = `rep-${Date.now()}`;
    const newReport: UserReport = {
      ...reportData,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    localStorage.setItem('jdmart_reports', JSON.stringify([newReport, ...reports]));
    try {
      await setDoc(doc(db, 'reports', id), newReport);
    } catch (err) {
      console.warn('Firestore report creation error:', err);
    }
    showToast('Report submitted. JD Mart Support & Safety will investigate.');
  };

  // Real-time Chat Messaging
  const sendMessage = async (
    recipientId: string,
    recipientName: string,
    text: string,
    orderId?: string
  ) => {
    if (!currentUser) {
      showToast('Please sign in to send messages');
      return;
    }
    const id = `msg-${Date.now()}`;
    const conversationId = [currentUser.id, recipientId].sort().join('_');
    const newMsg: ChatMessage = {
      id,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: String(currentUser.role),
      recipientId,
      receiverId: recipientId,
      recipientName,
      text,
      orderId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await setDoc(doc(db, 'messages', id), newMsg);

      // Trigger Webhook on server
      apiFetch('/api/chat/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          recipientId,
          recipientName,
          text,
          conversationId,
          orderId,
        }),
      }).catch((err) => console.warn('Chat webhook dispatch notice:', err));
    } catch (err) {
      console.warn('Firestore message send error:', err);
    }
    showToast('Message sent in real-time!');
  };

  // Products Management
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const id = `prod-${Date.now()}`;
    const newProd: Product = {
      ...prodData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    localStorage.setItem('jdmart_products', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'products', id), {
        ...newProd,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore product creation sync:', e);
    }

    showToast('Product listed successfully in Firestore catalog!');
    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    localStorage.setItem('jdmart_products', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore product update sync:', e);
    }
    showToast('Product updated successfully!');
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('jdmart_products', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.warn('Firestore product delete sync:', e);
    }
    showToast('Product removed from catalog');
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    );
    setProducts(updated);
    localStorage.setItem('jdmart_products', JSON.stringify(updated));
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: Math.max(0, newStock),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore stock update sync error:', e);
    }
    showToast(`Inventory updated to ${newStock} units`);
  };

  const toggleProductStatus = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const nextStatus: 'active' | 'inactive' = target.status === 'active' ? 'inactive' : 'active';
    const updated = products.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p));
    setProducts(updated);
    localStorage.setItem('jdmart_products', JSON.stringify(updated));
    try {
      await updateDoc(doc(db, 'products', productId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore product status toggle error:', e);
    }
    showToast(`Product status is now ${nextStatus}`);
  };

  // Cart Management
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('jdmart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updated = [...prev, { product, quantity }];
      }
      localStorage.setItem('jdmart_cart', JSON.stringify(updated));
      return updated;
    });
    showToast(`Added ${product.title.slice(0, 24)}... to cart!`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      localStorage.setItem('jdmart_cart', JSON.stringify(updated));
      return updated;
    });
    showToast('Item removed from cart');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('jdmart_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('jdmart_cart');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('jdmart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      localStorage.setItem('jdmart_wishlist', JSON.stringify(updated));
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist!');
      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Store Management & Seller Flow
  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)));
    localStorage.setItem(
      'jdmart_stores',
      JSON.stringify(stores.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
    );
    try {
      await updateDoc(doc(db, 'stores', storeId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore store update sync error:', e);
    }
    showToast('Store settings saved in real-time!');
  };

  const applyToBecomeSeller = async (storeData: Partial<Store>): Promise<Store> => {
    if (!currentUser) throw new Error('Must be signed in to apply');
    const newStoreId = `store-${currentUser.id.slice(0, 8)}`;
    const newStore: Store = {
      id: newStoreId,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      name: storeData.name || `${currentUser.name}'s Shop`,
      slug: (storeData.name || currentUser.name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logo: storeData.logo || '/assets/icons/store.png',
      banner: storeData.banner || '/assets/banners/slide1.png',
      category: storeData.category || 'General Merchant',
      description: storeData.description || 'Verified merchant storefront on JD Mart.',
      location: storeData.location || currentUser.city || 'Freetown',
      phone: storeData.phone || currentUser.phone,
      email: storeData.email || currentUser.email,
      status: 'pending',
      verified: false,
      rating: 5.0,
      totalSales: 0,
      totalProducts: 0,
      documentUrl: storeData.documentUrl || '',
      businessInfo: storeData.businessInfo || '',
      createdAt: new Date().toISOString(),
      bankDetails: storeData.bankDetails || {
        accountName: currentUser.name,
        accountNumber: currentUser.phone,
        bankName: 'Orange Money / Airtel Money',
        momoNumber: currentUser.phone,
      },
    };

    const updated = [newStore, ...stores.filter((s) => s.id !== newStoreId)];
    setStores(updated);
    localStorage.setItem('jdmart_stores', JSON.stringify(updated));

    // Update user store status
    await updateUserProfile({
      storeId: newStoreId,
    });

    try {
      await setDoc(doc(db, 'stores', newStoreId), newStore);
      // Admin notification
      await setDoc(doc(db, 'notifications', `notif-app-${Date.now()}`), {
        id: `notif-app-${Date.now()}`,
        userId: 'admin-master',
        title: 'New Seller Store Application',
        message: `${currentUser.name} applied to open merchant store "${newStore.name}" (${newStore.category}).`,
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore store application error:', e);
    }

    showToast('Seller application submitted! Status: Pending Admin Review.');
    return newStore;
  };

  const approveSellerStore = async (storeId: string) => {
    const storeTarget = stores.find((s) => s.id === storeId);
    if (!storeTarget) return;

    const updated = stores.map((s) =>
      s.id === storeId ? { ...s, status: 'active' as const, verified: true } : s
    );
    setStores(updated);
    localStorage.setItem('jdmart_stores', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        status: 'active',
        verified: true,
        updatedAt: new Date().toISOString(),
      });

      // Update user roles
      const sellerUser = users.find((u) => u.id === storeTarget.sellerId);
      if (sellerUser) {
        const currentRoles = (sellerUser.roles || [sellerUser.role]).map((r) => normalizeRole(r));
        const updatedRoles = Array.from(new Set([...currentRoles, 'SELLER' as CanonicalRole]));
        await updateDoc(doc(db, 'users', sellerUser.id), {
          roles: updatedRoles,
          role: 'SELLER',
          storeId: storeId,
          verified: true,
          updatedAt: new Date().toISOString(),
        });
      }

      if (currentUser && currentUser.id === storeTarget.sellerId) {
        const currentRoles = (currentUser.roles || [currentUser.role]).map((r) => normalizeRole(r));
        const updatedRoles = Array.from(new Set([...currentRoles, 'SELLER' as CanonicalRole]));
        const updatedUser: User = {
          ...currentUser,
          roles: updatedRoles,
          role: 'SELLER',
          storeId: storeId,
          verified: true,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('jdmart_current_user', JSON.stringify(updatedUser));
      }

      // Send congratulations notification to seller
      await setDoc(doc(db, 'notifications', `notif-appr-${Date.now()}`), {
        id: `notif-appr-${Date.now()}`,
        userId: storeTarget.sellerId,
        title: 'Merchant Application Approved! 🎉',
        message: `Your storefront "${storeTarget.name}" is now certified and live on JD Mart!`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore approve store sync error:', e);
    }
    showToast(`Store "${storeTarget.name}" approved! Seller privileges active.`);
  };

  const rejectSellerStore = async (storeId: string, reason: string) => {
    const storeTarget = stores.find((s) => s.id === storeId);
    if (!storeTarget) return;

    const updated = stores.map((s) =>
      s.id === storeId ? { ...s, status: 'rejected' as const, rejectionReason: reason, verified: false } : s
    );
    setStores(updated);
    localStorage.setItem('jdmart_stores', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'stores', storeId), {
        status: 'rejected',
        rejectionReason: reason,
        verified: false,
        updatedAt: new Date().toISOString(),
      });

      // Send notice to seller
      await setDoc(doc(db, 'notifications', `notif-rej-${Date.now()}`), {
        id: `notif-rej-${Date.now()}`,
        userId: storeTarget.sellerId,
        title: 'Merchant Application Update',
        message: `Your seller application for "${storeTarget.name}" was declined. Reason: ${reason}`,
        type: 'alert',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore reject store sync error:', e);
    }
    showToast(`Store application rejected.`);
  };

  // Payouts Management
  const requestPayout = async (
    amount: number,
    method: SellerPayout['method'],
    accountNumber: string,
    accountName?: string
  ) => {
    if (!currentUser) return;
    const id = `payo-${Date.now()}`;
    const newPayout: SellerPayout = {
      id,
      sellerId: currentUser.id,
      storeId: currentStore?.id || 'store-generic',
      storeName: currentStore?.name || currentUser.name,
      amount,
      method,
      accountNumber,
      accountName: accountName || currentUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setPayouts((prev) => [newPayout, ...prev]);
    localStorage.setItem('jdmart_payouts', JSON.stringify([newPayout, ...payouts]));

    try {
      await setDoc(doc(db, 'payouts', id), newPayout);
      showToast(`Payout request for Le ${amount} submitted for processing.`);
    } catch (e) {
      console.warn('Firestore payout request error:', e);
    }
  };

  const approvePayout = async (payoutId: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: 'Paid', paidAt: new Date().toISOString() } : p))
    );
    try {
      await updateDoc(doc(db, 'payouts', payoutId), {
        status: 'Paid',
        paidAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore approve payout error:', e);
    }
    showToast(`Payout #${payoutId} marked as Paid!`);
  };

  const respondToReview = async (reviewId: string, replyText: string) => {
    const updated = reviews.map((r) =>
      r.id === reviewId
        ? { ...r, sellerReply: { text: replyText, repliedAt: new Date().toISOString() } }
        : r
    );
    setReviews(updated);
    localStorage.setItem('jdmart_reviews', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        sellerReply: {
          text: replyText,
          repliedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Firestore review response sync error:', e);
    }
    showToast('Response posted to buyer review in real-time!');
  };

  // Orders & Deliveries
  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const newId = `JDM-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: Order = {
      id: newId,
      buyerId: currentUser?.id || 'guest-buyer',
      buyerName: orderData.buyerName || currentUser?.name || 'Customer',
      buyerPhone: orderData.buyerPhone || currentUser?.phone || '+232 77 000000',
      buyerAddress: orderData.buyerAddress || 'Central Freetown',
      buyerCity: orderData.buyerCity || 'Freetown',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 15,
      serviceFee: orderData.serviceFee || 5,
      total: orderData.total || 0,
      deliveryMethod: orderData.deliveryMethod || 'Standard',
      paymentStatus: 'Paid',
      orderStatus: 'Confirmed',
      sellerId: orderData.items?.[0]?.sellerId || 'seller-partner',
      sellerName: orderData.items?.[0]?.sellerName || 'JD Verified Store',
      timeline: [
        { status: 'Pending', timestamp: timeStr, description: 'Order submitted by buyer' },
        { status: 'Confirmed', timestamp: timeStr, description: 'Order confirmed and paid' },
      ],
      createdAt: timeStr,
      estimatedDelivery: 'Tomorrow by 2:00 PM',
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('jdmart_orders', JSON.stringify(updated));

    // Courier Delivery Entry
    const newDelivery: RiderDelivery = {
      id: `del-${Date.now().toString().slice(-4)}`,
      orderId: newId,
      pickupLocation: `${newOrder.sellerName} Warehouse, Freetown`,
      deliveryLocation: `${newOrder.buyerAddress}, ${newOrder.buyerCity}`,
      sellerName: newOrder.sellerName,
      sellerPhone: '+232 76 123456',
      customerName: newOrder.buyerName,
      customerPhone: newOrder.buyerPhone,
      packageDetails: `${newOrder.items.length} items (${newOrder.items.map((i) => i.title).join(', ')})`,
      deliveryFee: newOrder.deliveryFee + 10,
      status: 'Available',
      createdAt: timeStr,
    };
    setRiderDeliveries((prev) => [newDelivery, ...prev]);

    // Firestore Persistence
    try {
      await setDoc(doc(db, 'orders', newId), newOrder);
      await setDoc(doc(db, 'deliveries', newDelivery.id), newDelivery);
      await setDoc(doc(db, 'payments', `pay-${newId}`), {
        id: `pay-${newId}`,
        orderId: newId,
        userId: newOrder.buyerId,
        amount: newOrder.total,
        currency: 'SLL',
        status: 'Completed',
        paymentMethod: 'Escrow / Card / Mobile Money',
        transactionRef: `TX-${Date.now()}`,
        createdAt: timeStr,
      });
    } catch (e) {
      console.warn('Firestore order creation sync:', e);
    }

    // Trigger Order Confirmation Email to Buyer
    apiFetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_confirmation',
        to: currentUser?.email || 'customer@jdmart.sl',
        recipientName: newOrder.buyerName,
        orderId: newId,
        amount: newOrder.total,
        trackingUrl: `${window.location.origin}/orders/${newId}`,
      }),
    }).catch((e) => console.warn('Order email notification error:', e));

    // Trigger Seller Notification Email
    apiFetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'seller_notification',
        to: 'seller@jdmart.sl',
        recipientName: newOrder.sellerName,
        orderId: newId,
        amount: newOrder.total,
        details: `${newOrder.items.length} items ordered by ${newOrder.buyerName}. Please package for courier pickup.`,
      }),
    }).catch(() => {});

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedTarget: Order | null = null;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updated = {
            ...order,
            orderStatus: status,
            timeline: [
              ...order.timeline,
              { status, timestamp: timeStr, description: note || `Status updated to ${status}` },
            ],
          };
          updatedTarget = updated;
          return updated;
        }
        return order;
      })
    );

    try {
      if (updatedTarget) {
        await updateDoc(doc(db, 'orders', orderId), {
          orderStatus: status,
          timeline: (updatedTarget as Order).timeline,
          updatedAt: new Date().toISOString(),
        });

        // If marked Ready for Pickup, auto-create delivery request for riders if not already present
        if (status === 'Ready for Pickup') {
          const target = updatedTarget as Order;
          const deliveryId = `del-${orderId.replace('JDM-', '')}`;
          const existing = riderDeliveries.find((d) => d.id === deliveryId || d.orderId === orderId);
          if (!existing) {
            const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            const newDelivery: RiderDelivery = {
              id: deliveryId,
              orderId,
              pickupLocation: `${target.sellerName} Warehouse / Store, Freetown`,
              deliveryLocation: `${target.buyerAddress}, ${target.buyerCity}`,
              sellerId: target.sellerId,
              sellerName: target.sellerName,
              sellerPhone: '+232 76 123456',
              customerName: target.buyerName,
              customerPhone: target.buyerPhone,
              packageDetails: `${target.items.length} item(s): ${target.items.map((i) => i.title).join(', ')}`,
              itemsSummary: target.items.map((i) => `${i.quantity}x ${i.title}`).join(', '),
              totalOrderAmount: target.total,
              deliveryFee: (target.deliveryFee || 20) + 15,
              status: 'DELIVERY_ASSIGNED',
              deliveryOtp,
              timeline: [
                {
                  status: 'DELIVERY_ASSIGNED',
                  timestamp: timeStr,
                  description: 'Order marked ready for pickup. Broadcast to courier fleet.',
                },
              ],
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            };

            setRiderDeliveries((prev) => [newDelivery, ...prev.filter((d) => d.id !== deliveryId)]);
            await setDoc(doc(db, 'deliveries', deliveryId), newDelivery);
          }
        }
      }
    } catch (e) {
      console.warn('Firestore order status sync:', e);
    }

    // Send email alert for order status
    apiFetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_status',
        to: (updatedTarget as Order | null)?.buyerPhone || 'customer@jdmart.sl',
        orderId,
        details: note || `Your package is now: ${status}`,
      }),
    }).catch(() => {});

    showToast(`Order #${orderId} marked as ${status}`);
  };

  const assignRiderToOrder = async (orderId: string, riderId: string, riderName: string, riderPhone: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, riderId, riderName, riderPhone, orderStatus: 'Out for Delivery' } : o))
    );
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        riderId,
        riderName,
        riderPhone,
        orderStatus: 'Out for Delivery',
      });
    } catch (e) {
      console.warn('Firestore rider assignment sync:', e);
    }
    showToast(`Rider ${riderName} assigned to order #${orderId}`);
  };

  const rateOrder = async (orderId: string, rating: number) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, rating } : o)));
    try {
      await updateDoc(doc(db, 'orders', orderId), { rating });
    } catch (e) {
      console.warn('Firestore order rating sync:', e);
    }
    showToast(`Thank you for rating your order ${rating} stars!`);
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    await updateOrderStatus(orderId, 'Cancelled', `Cancellation reason: ${reason}`);
    showToast(`Order #${orderId} has been cancelled`);
  };

  // Courier Rider Fleet & Dispatch
  const [riderOnline, setRiderOnline] = useState<boolean>(true);
  const toggleRiderOnline = () => {
    setRiderOnline((prev) => {
      const next = !prev;
      if (currentRiderProfile) {
        setRiderAvailability(next ? 'ONLINE' : 'OFFLINE').catch(() => {});
      }
      showToast(next ? 'You are now ONLINE to receive orders' : 'You are now OFFLINE');
      return next;
    });
  };

  const setRiderAvailability = async (status: RiderAvailability) => {
    if (!currentUser) return;
    setRiderProfiles((prev) =>
      prev.map((r) => (r.userId === currentUser.id ? { ...r, availability: status } : r))
    );
    setRiderOnline(status === 'ONLINE' || status === 'AVAILABLE');
    try {
      const myProfile = riderProfiles.find((r) => r.userId === currentUser.id);
      if (myProfile) {
        await updateDoc(doc(db, 'riderProfiles', myProfile.id), {
          availability: status,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Firestore rider availability sync:', e);
    }
  };

  const applyAsDispatchRider = async (data: Partial<RiderProfile>): Promise<RiderProfile> => {
    if (!currentUser) throw new Error('Sign in required');
    const newId = `rider-${currentUser.id}`;
    const newProfile: RiderProfile = {
      id: newId,
      userId: currentUser.id,
      fullName: data.fullName || currentUser.name,
      profilePhoto: data.profilePhoto || currentUser.avatar || '/assets/icons/delivery.png',
      phoneNumber: data.phoneNumber || currentUser.phone || '+232 79 000000',
      address: data.address || currentUser.address || 'Central Freetown',
      city: data.city || currentUser.city || 'Freetown',
      identificationType: data.identificationType || 'National ID',
      idNumber: data.idNumber || '',
      idDocumentUrl: data.idDocumentUrl || '',
      vehicleType: data.vehicleType || 'Motorcycle',
      vehicleModel: data.vehicleModel || 'Bajaj Boxer 150',
      vehicleRegistrationNumber: data.vehicleRegistrationNumber || '',
      vehicleRegistrationDocumentUrl: data.vehicleRegistrationDocumentUrl || '',
      driverLicenseNumber: data.driverLicenseNumber || '',
      driverLicenseDocumentUrl: data.driverLicenseDocumentUrl || '',
      approvalStatus: 'pending',
      accountStatus: 'pending',
      availability: 'OFFLINE',
      currentDeliveryId: null,
      rating: 5.0,
      totalDeliveries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRiderProfiles((prev) => {
      const filtered = prev.filter((r) => r.userId !== currentUser.id && r.id !== newId);
      const updated = [newProfile, ...filtered];
      localStorage.setItem('jdmart_rider_profiles', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'riderProfiles', newId), newProfile);
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin-master',
        title: 'New Dispatch Rider Application',
        message: `${newProfile.fullName} submitted a rider application with vehicle ${newProfile.vehicleRegistrationNumber}.`,
        time: 'Just now',
        read: false,
        type: 'delivery',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore rider application sync error:', e);
    }

    showToast('Rider application submitted! Pending admin review.');
    return newProfile;
  };

  const approveRiderApplication = async (riderId: string) => {
    const profile = riderProfiles.find((r) => r.id === riderId);
    if (!profile) return;

    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.id === riderId
          ? {
              ...r,
              approvalStatus: 'approved',
              accountStatus: 'active',
              availability: 'ONLINE',
              activeSince: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    try {
      await updateDoc(doc(db, 'riderProfiles', riderId), {
        approvalStatus: 'approved',
        accountStatus: 'active',
        availability: 'ONLINE',
        activeSince: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      });

      const userRef = doc(db, 'users', profile.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data() as User;
        const currentRoles = uData.roles || [uData.role];
        const newRoles: UserRole[] = currentRoles.includes('DISPATCH_RIDER')
          ? currentRoles
          : [...currentRoles, 'DISPATCH_RIDER'];

        await updateDoc(userRef, {
          role: 'DISPATCH_RIDER',
          roles: newRoles,
          status: 'active',
          updatedAt: new Date().toISOString(),
        });

        if (currentUser && currentUser.id === profile.userId) {
          const updatedUser: User = { ...currentUser, role: 'DISPATCH_RIDER', roles: newRoles };
          setCurrentUser(updatedUser);
          localStorage.setItem('jdmart_current_user', JSON.stringify(updatedUser));
        }
      }

      await addDoc(collection(db, 'notifications'), {
        userId: profile.userId,
        title: 'Dispatch Rider Account Approved!',
        message: 'Your documents and vehicle have been verified. You can now receive delivery requests.',
        time: 'Just now',
        read: false,
        type: 'delivery',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore rider approval sync error:', e);
    }

    showToast(`Rider ${profile.fullName} approved and activated!`);
  };

  const rejectRiderApplication = async (riderId: string, reason: string) => {
    const profile = riderProfiles.find((r) => r.id === riderId);
    if (!profile) return;

    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.id === riderId
          ? { ...r, approvalStatus: 'rejected', rejectionReason: reason, updatedAt: new Date().toISOString() }
          : r
      )
    );

    try {
      await updateDoc(doc(db, 'riderProfiles', riderId), {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: profile.userId,
        title: 'Dispatch Rider Application Status',
        message: `Your rider application was not approved: ${reason}.`,
        time: 'Just now',
        read: false,
        type: 'delivery',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore rider reject sync error:', e);
    }
    showToast(`Rider application for ${profile.fullName} rejected.`);
  };

  const updateRiderProfile = async (riderId: string, updates: Partial<RiderProfile>) => {
    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.id === riderId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    );
    try {
      await updateDoc(doc(db, 'riderProfiles', riderId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore update rider profile error:', e);
    }
    showToast('Rider profile updated successfully!');
  };

  const suspendRiderAccount = async (riderId: string) => {
    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.id === riderId ? { ...r, accountStatus: 'suspended', availability: 'SUSPENDED', updatedAt: new Date().toISOString() } : r
      )
    );
    try {
      await updateDoc(doc(db, 'riderProfiles', riderId), {
        accountStatus: 'suspended',
        availability: 'SUSPENDED',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore suspend rider error:', e);
    }
    showToast('Rider account suspended.');
  };

  const activateRiderAccount = async (riderId: string) => {
    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.id === riderId ? { ...r, accountStatus: 'active', availability: 'ONLINE', updatedAt: new Date().toISOString() } : r
      )
    );
    try {
      await updateDoc(doc(db, 'riderProfiles', riderId), {
        accountStatus: 'active',
        availability: 'ONLINE',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore activate rider error:', e);
    }
    showToast('Rider account active & online.');
  };

  const acceptRiderDelivery = async (deliveryId: string) => {
    if (!currentUser) {
      showToast('Please sign in to accept delivery dispatches.');
      return;
    }
    const myProfile = riderProfiles.find((r) => r.userId === currentUser.id);
    if (!myProfile || myProfile.approvalStatus !== 'approved' || myProfile.accountStatus !== 'active') {
      showToast('Only approved, active dispatch riders can accept deliveries.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setRiderDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'GOING_TO_PICKUP',
              riderId: currentUser.id,
              riderName: currentUser.name,
              riderPhone: currentUser.phone || myProfile.phoneNumber,
              timeline: [
                ...(d.timeline || []),
                {
                  status: 'GOING_TO_PICKUP',
                  timestamp: timeStr,
                  description: `Assigned to ${currentUser.name}. Heading to pickup location.`,
                },
              ],
              updatedAt: now.toISOString(),
            }
          : d
      )
    );

    setRiderProfiles((prev) =>
      prev.map((r) =>
        r.userId === currentUser.id
          ? { ...r, availability: 'ON_DELIVERY', currentDeliveryId: deliveryId }
          : r
      )
    );

    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        status: 'GOING_TO_PICKUP',
        riderId: currentUser.id,
        riderName: currentUser.name,
        riderPhone: currentUser.phone || myProfile.phoneNumber,
        updatedAt: now.toISOString(),
      });
      await updateDoc(doc(db, 'riderProfiles', myProfile.id), {
        availability: 'ON_DELIVERY',
        currentDeliveryId: deliveryId,
        updatedAt: now.toISOString(),
      });
    } catch (e) {
      console.warn('Firestore delivery accept error:', e);
    }

    showToast('Delivery accepted! Head to the store location for pickup.');
  };

  const declineRiderDelivery = async (deliveryId: string) => {
    setRiderDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId && d.riderId === currentUser?.id
          ? { ...d, riderId: undefined, riderName: undefined, riderPhone: undefined, status: 'Available' }
          : d
      )
    );
    showToast('Delivery request declined.');
  };

  const updateRiderDeliveryStatus = async (
    deliveryId: string,
    newStatus: DeliveryStatus,
    details?: {
      failureReason?: string;
      cancellationReason?: string;
      proofPhoto?: string;
      proofNotes?: string;
      otpInput?: string;
    }
  ): Promise<boolean> => {
    const delivery = riderDeliveries.find((d) => d.id === deliveryId);
    if (!delivery) {
      showToast('Delivery not found.');
      return false;
    }

    if (newStatus === 'DELIVERED' && delivery.deliveryOtp && details?.otpInput) {
      if (details.otpInput.trim() !== delivery.deliveryOtp.trim()) {
        showToast('Invalid Customer Delivery OTP! Please enter the correct 4-digit code.');
        return false;
      }
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timelineEntry = {
      status: newStatus,
      timestamp: timeStr,
      description:
        newStatus === 'DELIVERED'
          ? `Package delivered successfully${details?.otpInput ? ' (OTP Verified)' : ''}`
          : newStatus === 'FAILED'
          ? `Delivery failed: ${details?.failureReason || 'Customer unavailable'}`
          : newStatus === 'CANCELLED'
          ? `Delivery cancelled: ${details?.cancellationReason || 'Cancelled by dispatch'}`
          : `Rider updated status to ${newStatus.replace(/_/g, ' ')}`,
    };

    const updatedDelivery: RiderDelivery = {
      ...delivery,
      status: newStatus,
      proofOfDeliveryPhoto: details?.proofPhoto || delivery.proofOfDeliveryPhoto,
      proofNotes: details?.proofNotes || delivery.proofNotes,
      failureReason: details?.failureReason || delivery.failureReason,
      cancellationReason: details?.cancellationReason || delivery.cancellationReason,
      pickupTimestamp: newStatus === 'ORDER_PICKED_UP' ? now.toISOString() : delivery.pickupTimestamp,
      deliveredTimestamp: newStatus === 'DELIVERED' ? now.toISOString() : delivery.deliveredTimestamp,
      timeline: [...(delivery.timeline || []), timelineEntry],
      updatedAt: now.toISOString(),
    };

    setRiderDeliveries((prev) => {
      const updated = prev.map((d) => (d.id === deliveryId ? updatedDelivery : d));
      localStorage.setItem('jdmart_rider_deliveries', JSON.stringify(updated));
      return updated;
    });

    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        status: newStatus,
        ...(details?.proofPhoto ? { proofOfDeliveryPhoto: details.proofPhoto } : {}),
        ...(details?.proofNotes ? { proofNotes: details.proofNotes } : {}),
        ...(details?.failureReason ? { failureReason: details.failureReason } : {}),
        ...(details?.cancellationReason ? { cancellationReason: details.cancellationReason } : {}),
        ...(newStatus === 'ORDER_PICKED_UP' ? { pickupTimestamp: now.toISOString() } : {}),
        ...(newStatus === 'DELIVERED' ? { deliveredTimestamp: now.toISOString() } : {}),
        timeline: updatedDelivery.timeline,
        updatedAt: now.toISOString(),
      });
    } catch (e) {
      console.warn('Firestore delivery update error:', e);
    }

    if (delivery.orderId) {
      if (newStatus === 'DELIVERED') {
        await updateOrderStatus(delivery.orderId, 'Delivered', 'Package handed to customer by courier.');
        if (currentUser) {
          setRiderProfiles((prev) =>
            prev.map((r) =>
              r.userId === currentUser.id
                ? {
                    ...r,
                    totalDeliveries: (r.totalDeliveries || 0) + 1,
                    availability: 'ONLINE',
                    currentDeliveryId: null,
                  }
                : r
            )
          );
        }
      } else if (newStatus === 'OUT_FOR_DELIVERY') {
        await updateOrderStatus(delivery.orderId, 'Out for Delivery', 'Courier is on the way with your package.');
      } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
        if (currentUser) {
          setRiderProfiles((prev) =>
            prev.map((r) =>
              r.userId === currentUser.id
                ? { ...r, availability: 'ONLINE', currentDeliveryId: null }
                : r
            )
          );
        }
      }
    }

    showToast(`Delivery status updated: ${newStatus.replace(/_/g, ' ')}`);
    return true;
  };

  const requestRiderPayout = async (
    amount: number,
    method: 'Orange Money' | 'Afrimoney' | 'Bank Transfer',
    accountNumber: string,
    accountName?: string
  ) => {
    if (!currentUser) return;
    const newPayout: RiderPayout = {
      id: `rp-${Date.now().toString().slice(-6)}`,
      riderId: currentUser.id,
      amount,
      method,
      accountNumber,
      accountName: accountName || currentUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setRiderPayouts((prev) => [newPayout, ...prev]);
    localStorage.setItem('jdmart_rider_payouts', JSON.stringify([newPayout, ...riderPayouts]));

    try {
      await setDoc(doc(db, 'riderPayouts', newPayout.id), newPayout);
    } catch (e) {
      console.warn('Firestore rider payout sync error:', e);
    }
    showToast(`Rider payout request of Le ${amount} submitted!`);
  };

  const approveRiderPayout = async (payoutId: string) => {
    setRiderPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: 'Paid', paidAt: new Date().toISOString() } : p))
    );
    try {
      await updateDoc(doc(db, 'riderPayouts', payoutId), {
        status: 'Paid',
        paidAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore approve rider payout error:', e);
    }
    showToast(`Rider payout #${payoutId} approved & marked as Paid!`);
  };

  const orderReadyForPickup = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await updateOrderStatus(orderId, 'Ready for Pickup', 'Merchant prepared order. Broadcast to dispatch couriers.');

    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryId = `del-${orderId.replace('JDM-', '')}`;

    const newDelivery: RiderDelivery = {
      id: deliveryId,
      orderId,
      pickupLocation: `${order.sellerName} Warehouse / Store, Freetown`,
      deliveryLocation: `${order.buyerAddress}, ${order.buyerCity}`,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      sellerPhone: '+232 76 123456',
      customerName: order.buyerName,
      customerPhone: order.buyerPhone,
      packageDetails: `${order.items.length} item(s): ${order.items.map((i) => i.title).join(', ')}`,
      itemsSummary: order.items.map((i) => `${i.quantity}x ${i.title}`).join(', '),
      totalOrderAmount: order.total,
      deliveryFee: (order.deliveryFee || 20) + 15,
      status: 'DELIVERY_ASSIGNED',
      deliveryOtp,
      timeline: [
        {
          status: 'DELIVERY_ASSIGNED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: 'Delivery request broadcast to nearby approved riders',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRiderDeliveries((prev) => {
      const filtered = prev.filter((d) => d.id !== deliveryId && d.orderId !== orderId);
      const updated = [newDelivery, ...filtered];
      localStorage.setItem('jdmart_rider_deliveries', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'deliveries', deliveryId), newDelivery);
    } catch (e) {
      console.warn('Firestore delivery request error:', e);
    }
    showToast(`Order #${orderId} marked Ready for Pickup! Courier dispatch request created.`);
  };

  // Backwards compatibility rider methods
  const acceptDelivery = async (deliveryId: string) => {
    await acceptRiderDelivery(deliveryId);
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    status: 'In Transit' | 'Delivered',
    photo?: string
  ) => {
    const canonicalStatus: DeliveryStatus = status === 'Delivered' ? 'DELIVERED' : 'OUT_FOR_DELIVERY';
    await updateRiderDeliveryStatus(deliveryId, canonicalStatus, { proofPhoto: photo });
  };

  // Employer & Jobs Management
  const saveEmployerProfile = async (data: Partial<EmployerProfile>): Promise<EmployerProfile> => {
    if (!currentUser) throw new Error('Sign in required');
    const existing = employerProfiles.find((e) => e.userId === currentUser.id);
    const profileId = existing ? existing.id : `emp-${currentUser.id}`;
    const profile: EmployerProfile = {
      id: profileId,
      userId: currentUser.id,
      companyName: data.companyName || currentUser.name,
      logo: data.logo || existing?.logo || '/assets/logos/applogo.png',
      description: data.description || existing?.description || '',
      phone: data.phone || currentUser.phone || '+232 76 000000',
      email: data.email || currentUser.email || '',
      location: data.location || currentUser.city || 'Freetown',
      website: data.website || existing?.website || '',
      industry: data.industry || existing?.industry || 'General',
      companySize: data.companySize || existing?.companySize || '1-10 Employees',
      companyInfo: data.companyInfo || existing?.companyInfo || '',
      verificationStatus: existing?.verificationStatus || 'unverified',
      documentUrl: data.documentUrl || existing?.documentUrl || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEmployerProfiles((prev) => {
      const filtered = prev.filter((e) => e.id !== profileId && e.userId !== currentUser.id);
      const updated = [profile, ...filtered];
      localStorage.setItem('jdmart_employer_profiles', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'employerProfiles', profileId), profile);
      const userRef = doc(db, 'users', currentUser.id);
      const currentRoles = currentUser.roles || [currentUser.role];
      if (!currentRoles.includes('EMPLOYER')) {
        const newRoles: UserRole[] = [...currentRoles, 'EMPLOYER'];
        await updateDoc(userRef, { roles: newRoles });
        const updatedUser: User = { ...currentUser, roles: newRoles };
        setCurrentUser(updatedUser);
        localStorage.setItem('jdmart_current_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.warn('Firestore employer profile error:', e);
    }

    showToast('Employer company profile saved successfully!');
    return profile;
  };

  const postJob = async (jobData: Omit<Job, 'id' | 'applicantCount' | 'postedDate'>): Promise<Job> => {
    const newId = `job-${Date.now()}`;
    const newJob: Job = {
      ...jobData,
      id: newId,
      applicantCount: 0,
      postedDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    localStorage.setItem('jdmart_jobs', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'jobs', newId), newJob);
    } catch (e) {
      console.warn('Firestore job creation sync:', e);
    }

    showToast('Job listing published to JD Mart Careers!');
    return newJob;
  };

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)));
    try {
      await updateDoc(doc(db, 'jobs', jobId), updates);
    } catch (e) {
      console.warn('Firestore update job error:', e);
    }
    showToast('Job listing updated!');
  };

  const closeJob = async (jobId: string) => {
    await updateJob(jobId, { status: 'closed' });
    showToast('Job listing closed.');
  };

  const deleteJob = async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (e) {
      console.warn('Firestore delete job error:', e);
    }
    showToast('Job listing deleted.');
  };

  const applyForJob = async (
    jobId: string,
    appData: {
      fullName: string;
      email: string;
      phone: string;
      coverNote: string;
      resumeSummary: string;
      resumeFileUrl?: string;
      employerId?: string;
      jobTitle?: string;
      companyName?: string;
    }
  ) => {
    let job = jobs.find((j) => j.id === jobId);
    if (!job && jobId) {
      try {
        const snap = await getDoc(doc(db, 'jobs', jobId));
        if (snap.exists()) {
          job = { id: snap.id, ...snap.data() } as Job;
        }
      } catch (err) {
        console.warn('Direct job lookup notice:', err);
      }
    }

    const verifiedEmployerId = appData.employerId || job?.employerId || currentEmployer?.id || 'emp-user';
    const verifiedJobTitle = appData.jobTitle || job?.title || 'Open Position';
    const verifiedCompanyName = appData.companyName || job?.employerName || 'Employer';

    console.log("[applyForJob] Writing to 'job_applications' collection with verified employerId:", {
      jobId,
      employerId: verifiedEmployerId,
      jobEmployerId: job?.employerId,
      jobTitle: verifiedJobTitle,
      candidate: appData.fullName,
    });

    const newAppId = `app-${Date.now()}`;
    const newApplication: JobApplication = {
      id: newAppId,
      jobId,
      jobTitle: verifiedJobTitle,
      companyName: verifiedCompanyName,
      employerId: verifiedEmployerId,
      applicantId: currentUser?.id || `cand-${Date.now()}`,
      fullName: appData.fullName,
      email: appData.email,
      phone: appData.phone,
      coverNote: appData.coverNote,
      resumeSummary: appData.resumeSummary,
      resumeFileUrl: appData.resumeFileUrl,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) => {
      const updated = [newApplication, ...prev];
      localStorage.setItem('jdmart_applications', JSON.stringify(updated));
      return updated;
    });

    // Automatically register/update candidate in worker profiles so employer sees them in Worker Search
    const candidateWorker: WorkerProfile = {
      id: `worker-${newApplication.applicantId}`,
      userId: newApplication.applicantId,
      fullName: appData.fullName,
      avatar: currentUser?.avatar || '/assets/icons/account.gif',
      title: job?.title ? `Applicant: ${job.title}` : 'Skilled Candidate',
      category: job?.category || 'Logistics',
      skills: appData.resumeSummary
        ? appData.resumeSummary.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
        : ['Reliable', 'Communication', 'Work Ethic'],
      experienceYears: 2,
      experienceLevel: 'Intermediate',
      location: job?.location || 'Freetown',
      availability: 'Available Immediately',
      bio: appData.coverNote || 'Active job candidate on JD Mart.',
      phone: appData.phone,
      email: appData.email,
      resumeUrl: appData.resumeFileUrl,
      rating: 5.0,
      completedJobs: 0,
    };

    setWorkerProfiles((prev) => {
      const filtered = prev.filter((w) => w.userId !== candidateWorker.userId && w.id !== candidateWorker.id);
      const updatedWorkers = [candidateWorker, ...filtered];
      localStorage.setItem('jdmart_worker_profiles', JSON.stringify(updatedWorkers));
      return updatedWorkers;
    });

    try {
      // Primary: write to 'job_applications' collection as required
      await setDoc(doc(db, 'job_applications', newAppId), newApplication);
      // Secondary: also sync to legacy 'applications' collection
      await setDoc(doc(db, 'applications', newAppId), newApplication).catch(() => {});
      await setDoc(doc(db, 'workerProfiles', candidateWorker.id), candidateWorker);
      if (job) {
        await updateDoc(doc(db, 'jobs', jobId), {
          applicantCount: (job.applicantCount || 0) + 1,
        });
      }
      if (verifiedEmployerId) {
        const notifId = `notif-${Date.now()}`;
        const empNotif: AppNotification = {
          id: notifId,
          userId: verifiedEmployerId,
          title: 'New Candidate Application Received',
          message: `${appData.fullName} applied for ${verifiedJobTitle}. Review their details on your Employer Dashboard.`,
          time: 'Just now',
          type: 'job',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [empNotif, ...prev]);
        await setDoc(doc(db, 'notifications', notifId), empNotif).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore job application sync error:', e);
    }

    apiFetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'job_application',
        to: appData.email,
        recipientName: appData.fullName,
        jobTitle: verifiedJobTitle,
      }),
    }).catch(() => {});

    showToast('Application submitted successfully!');
  };

  const updateApplicationStatus = async (
    appId: string,
    status: JobApplication['status'],
    notes?: string,
    rating?: number
  ) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status,
              ...(notes ? { notes } : {}),
              ...(rating !== undefined ? { rating } : {}),
            }
          : a
      )
    );
    try {
      const updates = {
        status,
        ...(notes ? { notes } : {}),
        ...(rating !== undefined ? { rating } : {}),
      };
      await updateDoc(doc(db, 'job_applications', appId), updates);
      await updateDoc(doc(db, 'applications', appId), updates).catch(() => {});
    } catch (e) {
      console.warn('Firestore app status sync:', e);
    }
    showToast(`Application marked as ${status}`);
  };

  const saveWorkerProfile = async (data: Partial<WorkerProfile>): Promise<WorkerProfile> => {
    if (!currentUser) throw new Error('Sign in required');
    const existing = workerProfiles.find((w) => w.userId === currentUser.id);
    const workerId = existing ? existing.id : `worker-${currentUser.id}`;
    const profile: WorkerProfile = {
      id: workerId,
      userId: currentUser.id,
      fullName: data.fullName || currentUser.name,
      avatar: data.avatar || currentUser.avatar || '/assets/icons/account.gif',
      title: data.title || 'Professional Worker',
      category: data.category || 'General',
      skills: data.skills || [],
      experienceYears: data.experienceYears || 1,
      experienceLevel: data.experienceLevel || 'Intermediate',
      location: data.location || currentUser.city || 'Freetown',
      availability: data.availability || 'Available Immediately',
      bio: data.bio || '',
      phone: data.phone || currentUser.phone || '+232 77 000000',
      email: data.email || currentUser.email || '',
      hourlyRate: data.hourlyRate || 50,
      resumeUrl: data.resumeUrl || '',
      rating: existing?.rating || 5.0,
      completedJobs: existing?.completedJobs || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    setWorkerProfiles((prev) => {
      const filtered = prev.filter((w) => w.id !== workerId && w.userId !== currentUser.id);
      const updated = [profile, ...filtered];
      localStorage.setItem('jdmart_worker_profiles', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'workerProfiles', workerId), profile);
    } catch (e) {
      console.warn('Firestore save worker profile error:', e);
    }

    showToast('Worker profile saved successfully!');
    return profile;
  };

  const scheduleInterview = async (
    details: Omit<InterviewSchedule, 'id' | 'createdAt' | 'status'>
  ): Promise<InterviewSchedule> => {
    const newId = `int-${Date.now()}`;
    const interview: InterviewSchedule = {
      ...details,
      id: newId,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    };

    setInterviews((prev) => [interview, ...prev]);
    localStorage.setItem('jdmart_interviews', JSON.stringify([interview, ...interviews]));

    try {
      await setDoc(doc(db, 'interviews', newId), interview);
      await updateApplicationStatus(details.applicationId, 'Interview', details.notes);

      await addDoc(collection(db, 'notifications'), {
        userId: details.applicantId,
        title: `Interview Scheduled: ${details.jobTitle}`,
        message: `${details.employerName} invited you for an interview on ${details.date} at ${details.time} (${details.mode}: ${details.locationOrLink}).`,
        time: 'Just now',
        read: false,
        type: 'job',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore schedule interview error:', e);
    }

    showToast(`Interview scheduled with ${details.applicantName}!`);
    return interview;
  };

  const updateInterviewStatus = async (
    interviewId: string,
    status: InterviewSchedule['status']
  ) => {
    setInterviews((prev) =>
      prev.map((i) => (i.id === interviewId ? { ...i, status } : i))
    );
    try {
      await updateDoc(doc(db, 'interviews', interviewId), { status });
    } catch (e) {
      console.warn('Firestore update interview error:', e);
    }
    showToast(`Interview marked as ${status}`);
  };

  // Cloud Storage & Gemini AI
  const uploadFile = async (
    file: File,
    category: StorageCategory,
    entityId = 'general',
    onProgress?: (p: number) => void
  ): Promise<UploadedFileMetadata> => {
    const uploaderId = currentUser?.id || 'guest_user';
    const metadata = await uploadAppFile(file, category, entityId, uploaderId, onProgress);
    showToast(`File "${file.name}" uploaded successfully!`);
    return metadata;
  };

  const generateAIDescription = async (title: string, category?: string): Promise<string> => {
    try {
      const res = await apiFetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category }),
      });
      const data = await res.json();
      if (data.description) {
        return data.description;
      }
      return `Premium ${title} available with fast dispatch delivery across Sierra Leone. Guaranteed quality and genuine build.`;
    } catch {
      return `High quality ${title} with official guarantee and nationwide dispatch in Sierra Leone.`;
    }
  };

  const analyzeImageWithAI = async (imageUrl?: string, base64?: string): Promise<any> => {
    try {
      const res = await apiFetch('/api/ai/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, base64Data: base64 }),
      });
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('AI image analysis error:', err);
      return null;
    }
  };

  // Admin Platform Operations & Governance
  const recordAuditLog = async (
    action: string,
    targetType: string,
    targetId: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<AuditLog> => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminId: currentUser?.id || 'admin-system',
      adminName: currentUser?.name || 'Administrator',
      action,
      targetType,
      targetId,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    localStorage.setItem('jdmart_audit_logs', JSON.stringify([newLog, ...auditLogs.slice(0, 100)]));
    try {
      await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
    } catch (e) {
      console.warn('Firestore record audit log notice:', e);
    }
    return newLog;
  };

  const updateUserRolePermissions = async (
    userId: string,
    targetRole: 'SELLER' | 'EMPLOYER' | 'DISPATCH_RIDER',
    enable: boolean
  ) => {
    const u = users.find((usr) => usr.id === userId);
    if (!u) return;

    const currentRoles = (u.roles && u.roles.length > 0 ? u.roles : [u.role]).map((r) => String(r).toUpperCase());
    let newRoles: UserRole[];
    if (enable) {
      newRoles = currentRoles.includes(targetRole)
        ? (currentRoles as UserRole[])
        : ([...currentRoles, targetRole] as UserRole[]);
    } else {
      newRoles = currentRoles.filter((r) => r !== targetRole) as UserRole[];
      if (newRoles.length === 0) newRoles = ['BUYER'];
    }

    setUsers((prev) =>
      prev.map((usr) => (usr.id === userId ? { ...usr, roles: newRoles, role: newRoles[0] } : usr))
    );

    try {
      await updateDoc(doc(db, 'users', userId), {
        roles: newRoles,
        role: newRoles[0],
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        'ADMIN_CHANGED_USER_ROLES',
        'User',
        userId,
        `Admin modified roles for ${u.name} (${u.email}): ${enable ? 'granted' : 'removed'} ${targetRole}.`,
        { previousRoles: currentRoles, newRoles }
      );
    } catch (e) {
      console.warn('Firestore update roles notice:', e);
    }
    showToast(`Updated role permissions for ${u.name}`);
  };

  const setUserAccountStatus = async (
    userId: string,
    status: 'active' | 'suspended' | 'pending',
    reason?: string
  ) => {
    setUsers((prev) =>
      prev.map((usr) => (usr.id === userId ? { ...usr, status } : usr))
    );
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        status === 'suspended' ? 'ADMIN_SUSPENDED_USER' : 'ADMIN_ACTIVATED_USER',
        'User',
        userId,
        `Admin set user ${userId} account status to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
        { status, reason }
      );
    } catch (e) {
      console.warn('Firestore set user status notice:', e);
    }
    showToast(`User status updated to ${status}.`);
  };

  const moderateProduct = async (
    productId: string,
    action: 'approve' | 'reject' | 'hide' | 'unhide' | 'delete' | 'toggleFeatured',
    reason?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (action === 'delete') {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      try {
        await deleteDoc(doc(db, 'products', productId));
        await recordAuditLog(
          'ADMIN_REMOVED_PRODUCT',
          'Product',
          productId,
          `Admin removed product "${prod.title}". ${reason ? `Reason: ${reason}` : ''}`,
          { productTitle: prod.title, sellerId: prod.sellerId }
        );
      } catch (e) {
        console.warn('Firestore product delete notice:', e);
      }
      showToast(`Product "${prod.title}" deleted.`);
      return;
    }

    let statusUpdate: Product['status'] = prod.status;
    let featuredUpdate = prod.featured;
    let auditAction = 'ADMIN_MODERATED_PRODUCT';

    if (action === 'approve') {
      statusUpdate = 'active';
      auditAction = 'ADMIN_APPROVED_PRODUCT';
    } else if (action === 'reject') {
      statusUpdate = 'rejected';
      auditAction = 'ADMIN_REJECTED_PRODUCT';
    } else if (action === 'hide') {
      statusUpdate = 'hidden';
      auditAction = 'ADMIN_HIDDEN_PRODUCT';
    } else if (action === 'unhide') {
      statusUpdate = 'active';
      auditAction = 'ADMIN_UNHIDDEN_PRODUCT';
    } else if (action === 'toggleFeatured') {
      featuredUpdate = !prod.featured;
      auditAction = 'ADMIN_FEATURED_PRODUCT';
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, status: statusUpdate, featured: featuredUpdate } : p
      )
    );

    try {
      await updateDoc(doc(db, 'products', productId), {
        status: statusUpdate,
        featured: featuredUpdate,
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        auditAction,
        'Product',
        productId,
        `Admin updated product "${prod.title}" to ${statusUpdate}.`,
        { action, previousStatus: prod.status, newStatus: statusUpdate }
      );
    } catch (e) {
      console.warn('Firestore product moderation notice:', e);
    }
    showToast(`Product "${prod.title}" updated.`);
  };

  const addCategory = async (cat: Omit<Category, 'id' | 'itemCount'>) => {
    const newCat: Category = {
      id: `cat-${cat.slug || Date.now()}`,
      itemCount: 0,
      ...cat,
    };
    setCategories((prev) => [...prev, newCat]);
    localStorage.setItem('jdmart_categories', JSON.stringify([...categories, newCat]));
    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
      await recordAuditLog('ADMIN_CREATED_CATEGORY', 'Category', newCat.id, `Admin created category "${newCat.name}"`);
    } catch (e) {
      console.warn('Firestore add category notice:', e);
    }
    showToast(`Category "${newCat.name}" added successfully.`);
  };

  const deleteCategory = async (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    try {
      await deleteDoc(doc(db, 'categories', catId));
      await recordAuditLog('ADMIN_DELETED_CATEGORY', 'Category', catId, `Admin deleted category #${catId}`);
    } catch (e) {
      console.warn('Firestore delete category notice:', e);
    }
    showToast('Category deleted.');
  };

  const resolveComplaint = async (complaintId: string, notes: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, status: 'Resolved', resolutionNotes: notes, resolvedAt: new Date().toISOString() }
          : c
      )
    );
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: 'Resolved',
        resolutionNotes: notes,
        resolvedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        'ADMIN_RESOLVED_COMPLAINT',
        'Complaint',
        complaintId,
        `Admin resolved complaint #${complaintId}. Resolution: ${notes}`,
        { complaintId, notes }
      );
    } catch (e) {
      console.warn('Firestore resolve complaint notice:', e);
    }
    showToast(`Complaint #${complaintId} resolved.`);
  };

  const submitComplaint = async (data: Omit<PlatformComplaint, 'id' | 'createdAt' | 'status'>) => {
    const newC: PlatformComplaint = {
      id: `cmp-${Date.now()}`,
      status: 'Open',
      createdAt: new Date().toISOString(),
      ...data,
    };
    setComplaints((prev) => [newC, ...prev]);
    localStorage.setItem('jdmart_complaints', JSON.stringify([newC, ...complaints]));
    try {
      await setDoc(doc(db, 'complaints', newC.id), newC);
    } catch (e) {
      console.warn('Firestore submit complaint notice:', e);
    }
    showToast('Complaint submitted to Platform Administrator.');
  };

  const updatePlatformSettings = async (updates: Partial<PlatformSettings>) => {
    const updated = { ...platformSettings, ...updates };
    setPlatformSettings(updated);
    localStorage.setItem('jdmart_platform_settings', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'platformSettings', 'global'), updated);
      await recordAuditLog('ADMIN_UPDATED_SETTINGS', 'Settings', 'global', 'Admin updated platform configurations.', updates);
    } catch (e) {
      console.warn('Firestore settings update notice:', e);
    }
    showToast('Platform settings saved successfully!');
  };

  const reassignDeliveryRider = async (
    deliveryId: string,
    newRiderId: string,
    newRiderName: string,
    newRiderPhone?: string
  ) => {
    setRiderDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              riderId: newRiderId,
              riderName: newRiderName,
              riderPhone: newRiderPhone || d.riderPhone,
              timeline: [
                ...(d.timeline || []),
                {
                  status: d.status,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  description: `Admin reassigned dispatch to courier ${newRiderName}`,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        riderId: newRiderId,
        riderName: newRiderName,
        riderPhone: newRiderPhone,
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        'ADMIN_REASSIGNED_DELIVERY',
        'Delivery',
        deliveryId,
        `Admin reassigned delivery #${deliveryId} to courier ${newRiderName} (${newRiderId}).`,
        { deliveryId, newRiderId, newRiderName }
      );
    } catch (e) {
      console.warn('Firestore reassign delivery notice:', e);
    }
    showToast(`Delivery reassigned to ${newRiderName}.`);
  };

  const adminCancelOrder = async (orderId: string, reason: string) => {
    await updateOrderStatus(orderId, 'Cancelled', `Cancelled by JD Mart Administration: ${reason}`);
    await recordAuditLog(
      'ADMIN_CANCELLED_ORDER',
      'Order',
      orderId,
      `Admin cancelled order #${orderId}. Reason: ${reason}`,
      { orderId, reason }
    );
    showToast(`Order #${orderId} cancelled.`);
  };

  const broadcastNotification = async (
    target: 'all' | 'sellers' | 'riders' | 'employers' | string,
    title: string,
    message: string
  ) => {
    const notifId = `broadcast-${Date.now()}`;
    const newNotif: AppNotification = {
      id: notifId,
      title,
      message,
      time: 'Just now',
      read: false,
      type: 'system',
      createdAt: new Date().toISOString(),
      userId: target === 'all' ? 'global' : target,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    try {
      await addDoc(collection(db, 'notifications'), newNotif);
      await recordAuditLog(
        'ADMIN_BROADCAST_NOTIFICATION',
        'Notification',
        notifId,
        `Admin broadcast alert to target [${target}]: "${title}"`,
        { target, title }
      );
    } catch (e) {
      console.warn('Firestore broadcast notification notice:', e);
    }
    showToast('Notification broadcast sent successfully!');
  };

  const resolveReport = async (reportId: string, notes: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
    );
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        updatedAt: new Date().toISOString(),
      });
      await recordAuditLog(
        'ADMIN_RESOLVED_REPORT',
        'Report',
        reportId,
        `Admin resolved report #${reportId}. Notes: ${notes}`,
        { reportId, notes }
      );
    } catch (e) {
      console.warn('Firestore report resolve notice:', e);
    }
    showToast(`Report #${reportId} marked as resolved.`);
  };

  // UI Drawer, Notifications & Cart Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        currentUser,
        firebaseUser,
        authLoading,
        userRole,
        canonicalRole,
        userRoles,
        switchRole,
        addRoleToUser,
        login,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        resetPassword,
        sendVerificationEmail,
        logout,
        updateUserProfile,
        users,
        updateUserStatus,

        // Delivery Addresses
        deliveryAddresses,
        addDeliveryAddress,
        updateDeliveryAddress,
        deleteDeliveryAddress,
        setDefaultDeliveryAddress,

        categories,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        toggleProductStatus,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,

        wishlist,
        toggleWishlist,
        isInWishlist,

        orders,
        createOrder,
        updateOrderStatus,
        assignRiderToOrder,
        rateOrder,
        cancelOrder,
        confirmOrderDelivery,

        // Payments & Payouts
        payments,
        payouts,
        requestPayout,
        approvePayout,

        // Reviews
        reviews,
        submitReview,
        respondToReview,

        // Reports
        reports,
        submitReport,

        // Messages & Real-Time Chat
        messages,
        sendMessage,
        activeChatRecipient,
        openChatWithUser,
        closeChatModal,
        isChatDrawerOpen,
        setIsChatDrawerOpen,
        testNotificationAlert,

        // Stores & Seller Flow
        stores,
        currentStore,
        applyToBecomeSeller,
        approveSellerStore,
        rejectSellerStore,
        updateStore,

        riderDeliveries,
        riderOnline,
        toggleRiderOnline,
        acceptDelivery,
        updateDeliveryStatus,
        riderProfiles,
        currentRiderProfile,
        applyAsDispatchRider,
        approveRiderApplication,
        rejectRiderApplication,
        updateRiderProfile,
        suspendRiderAccount,
        activateRiderAccount,
        setRiderAvailability,
        acceptRiderDelivery,
        declineRiderDelivery,
        updateRiderDeliveryStatus,
        riderPayouts,
        requestRiderPayout,
        approveRiderPayout,
        orderReadyForPickup,

        jobs,
        applications,
        employerProfiles,
        currentEmployer,
        saveEmployerProfile,
        postJob,
        updateJob,
        closeJob,
        deleteJob,
        applyForJob,
        updateApplicationStatus,
        workerProfiles,
        saveWorkerProfile,
        interviews,
        scheduleInterview,
        updateInterviewStatus,

        uploadFile,
        generateAIDescription,
        analyzeImageWithAI,

        // Admin Platform Operations & Governance
        auditLogs,
        recordAuditLog,
        updateUserRolePermissions,
        setUserAccountStatus,
        moderateProduct,
        addCategory,
        deleteCategory,
        complaints,
        resolveComplaint,
        submitComplaint,
        platformSettings,
        updatePlatformSettings,
        reassignDeliveryRider,
        adminCancelOrder,
        broadcastNotification,
        resolveReport,

        toastMessage,
        showToast,
        isDrawerOpen,
        setIsDrawerOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isCartOpen,
        setIsCartOpen,
        notifications,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
