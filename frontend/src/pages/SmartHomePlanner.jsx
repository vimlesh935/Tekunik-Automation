import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Zap,
  Lightbulb,
  Thermometer,
  Lock,
  Camera,
  Cpu,
  ChevronLeft,
  Save,
  Smartphone,
  Wifi,
  Volume2,
  ShowerHead,
  UtensilsCrossed,
  Sun,
  Building2,
  Briefcase,
  Pencil,
  Warehouse,
  Plus,
  Trash2,
  DoorOpen,
  Sofa,
  Bed,
  CookingPot,
  Bath,
  Trees,
  Monitor,
  Car,
  Fan,
  Tv,
  Plug,
  Bell,
  Radio,
  Shield,
  WifiIcon,
  Minus,
  ShoppingCart,
  Star,
  Percent,
  Wrench,
  ClipboardList,
  X,
  User,
} from "lucide-react";
import { productService, cartService } from "../services/api";

/* ------------------------------------------------------------------ */
/*  Home type definitions & default room templates                     */
/* ------------------------------------------------------------------ */
const HOME_TYPES = [
  { id: "1-rk", label: "1 RK", description: "Compact studio apartment with one hall, kitchen & bedroom combined.", icon: Home },
  { id: "1-bhk", label: "1 BHK", description: "One bedroom, hall, and kitchen — perfect for small families.", icon: Home },
  { id: "2-bhk", label: "2 BHK", description: "Two bedrooms with hall and kitchen — ideal for growing families.", icon: Building2 },
  { id: "3-bhk", label: "3 BHK", description: "Three bedrooms with spacious hall and modern kitchen.", icon: Building2 },
  { id: "4-bhk", label: "4 BHK", description: "Four bedrooms with premium living spaces and smart-ready layout.", icon: Building2 },
  { id: "villa", label: "Villa", description: "Independent villa with multiple floors and outdoor areas.", icon: Warehouse },
  { id: "office", label: "Office", description: "Commercial office space with workstations and meeting rooms.", icon: Briefcase },
  { id: "custom", label: "Custom", description: "A unique space that doesn't fit the standard categories.", icon: Pencil },
];

const HOME_TYPE_ROOMS = {
  "1-rk": ["Living cum Bedroom", "Kitchen", "Bathroom"],
  "1-bhk": ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Balcony"],
  "2-bhk": ["Living Room", "Master Bedroom", "Bedroom 2", "Kitchen", "Bathroom 1", "Bathroom 2", "Balcony"],
  "3-bhk": ["Living Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Kitchen", "Bathroom 1", "Bathroom 2", "Balcony"],
  "4-bhk": ["Living Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Bedroom 4", "Kitchen", "Bathroom 1", "Bathroom 2", "Bathroom 3", "Balcony"],
  "villa": ["Living Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Kitchen", "Dining Room", "Bathroom 1", "Bathroom 2", "Bathroom 3", "Garden", "Garage", "Balcony"],
  "office": ["Reception", "Cabin", "Workstation Area", "Meeting Room", "Pantry", "Washroom"],
  "custom": ["Living Room", "Bedroom", "Kitchen", "Bathroom"],
};

function getRoomIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("living") || n.includes("hall")) return Sofa;
  if (n.includes("bedroom") || n.includes("bed")) return Bed;
  if (n.includes("kitchen")) return CookingPot;
  if (n.includes("bath") || n.includes("washroom")) return Bath;
  if (n.includes("balcony") || n.includes("garden")) return Trees;
  if (n.includes("reception") || n.includes("cabin")) return Briefcase;
  if (n.includes("workstation") || n.includes("meeting")) return Monitor;
  if (n.includes("pantry")) return UtensilsCrossed;
  if (n.includes("garage")) return Car;
  if (n.includes("dining")) return UtensilsCrossed;
  if (n.includes("stair")) return DoorOpen;
  return DoorOpen;
}

const ROOM_COLORS = [
  "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  "from-cyan-500/20 to-sky-500/20 border-cyan-500/30",
  "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30",
  "from-lime-500/20 to-green-500/20 border-lime-500/30",
  "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
  "from-red-500/20 to-rose-500/20 border-red-500/30",
  "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
  "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "from-sky-500/20 to-blue-500/20 border-sky-500/30",
  "from-fuchsia-500/20 to-violet-500/20 border-fuchsia-500/30",
  "from-green-500/20 to-emerald-500/20 border-green-500/30",
];

let roomIdCounter = 1000;
function nextRoomId() {
  roomIdCounter += 1;
  return `room-${roomIdCounter}`;
}

const DEVICE_TYPES = [
  { id: "lights", label: "Lights", icon: Lightbulb },
  { id: "fans", label: "Fans", icon: Fan },
  { id: "curtains", label: "Curtains", icon: Sun },
  { id: "ac", label: "AC", icon: Thermometer },
  { id: "tv", label: "TV", icon: Tv },
  { id: "smart-plug", label: "Smart Plug", icon: Plug },
  { id: "door-lock", label: "Door Lock", icon: Lock },
  { id: "door-bell", label: "Door Bell", icon: Bell },
  { id: "motion-sensor", label: "Motion Sensor", icon: Radio },
  { id: "smoke-sensor", label: "Smoke Sensor", icon: Shield },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "wifi-ap", label: "Wi-Fi AP", icon: WifiIcon },
];

const DEVICE_APPLICATION_MAP = {
  lights: ["smart-lighting", "lighting", "smart-bulb", "dimmer"],
  fans: ["smart-fan", "fan-controller", "fan"],
  curtains: ["smart-curtain", "curtain", "blind"],
  ac: ["smart-ac", "air-conditioner", "climate"],
  tv: ["smart-tv", "tv", "television"],
  "smart-plug": ["smart-plug", "plug", "outlet"],
  "door-lock": ["smart-lock", "door-lock", "security"],
  "door-bell": ["doorbell", "video-doorbell", "intercom"],
  "motion-sensor": ["motion-sensor", "sensor", "security"],
  "smoke-sensor": ["smoke-detector", "smoke-sensor", "safety"],
  camera: ["smart-camera", "cctv", "security-camera"],
  "wifi-ap": ["wifi-router", "access-point", "networking"],
};

function createDefaultDeviceConfig() {
  return Object.fromEntries(
    DEVICE_TYPES.map((d) => [d.id, { enabled: false, quantity: 1, notes: "" }])
  );
}

const OTHER_OPTIONS_STEPS = [
  {
    id: "lighting",
    label: "Lighting",
    icon: Lightbulb,
    title: "Choose your lighting preferences",
    description: "Tell us how you'd like your smart lighting to work throughout your home.",
    options: [
      { id: "smart-bulbs", label: "Smart Bulbs", icon: Lightbulb },
      { id: "dimmers", label: "Dimmer Switches", icon: Zap },
      { id: "motion-lights", label: "Motion-Activated Lights", icon: Wifi },
      { id: "ambient", label: "Ambient Lighting", icon: Sun },
    ],
  },
  {
    id: "climate",
    label: "Climate",
    icon: Thermometer,
    title: "Set your climate control preferences",
    description: "Configure how you want to manage temperature and air quality.",
    options: [
      { id: "smart-thermostat", label: "Smart Thermostat", icon: Thermometer },
      { id: "ac-control", label: "AC Control", icon: Zap },
      { id: "air-purifier", label: "Air Purifier", icon: Wifi },
      { id: "floor-heating", label: "Floor Heating", icon: Sun },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Lock,
    title: "Choose your security setup",
    description: "Select the security features you want to integrate.",
    options: [
      { id: "smart-locks", label: "Smart Locks", icon: Lock },
      { id: "doorbell", label: "Video Doorbell", icon: Camera },
      { id: "alarm", label: "Security Alarm", icon: Zap },
      { id: "motion-sensors", label: "Motion Sensors", icon: Wifi },
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Volume2,
    title: "Set up your entertainment systems",
    description: "Choose how you want to automate your media and audio experience.",
    options: [
      { id: "smart-tv", label: "Smart TV", icon: Smartphone },
      { id: "speakers", label: "Multi-Room Audio", icon: Volume2 },
      { id: "streaming", label: "Media Streaming", icon: Wifi },
      { id: "home-theater", label: "Home Theater", icon: Cpu },
    ],
  },
  {
    id: "review",
    label: "Review",
    icon: Check,
    title: "Review your smart home plan",
    description: "Take a look at your selections before we finalize.",
    options: [],
  },
];

function ProductCardSkeleton() {
  return (
    <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse">
      <div className="w-full h-28 rounded-xl bg-slate-800/60 mb-3" />
      <div className="h-3 w-16 rounded bg-slate-800/60 mb-2" />
      <div className="h-3 w-full rounded bg-slate-800/40" />
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function SmartHomePlanner() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});

  const [recommendations, setRecommendations] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);

  const [summaryDiscount, setSummaryDiscount] = useState(0);
  const [installationCharges, setInstallationCharges] = useState(0);

  const [proposalForm, setProposalForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const isHomeTypeStep = currentStep === 0;
  const isRoomsStep = currentStep === 1;
  const isDevicesStep = currentStep === 2;
  const isRecommendationsStep = currentStep === 3;
  const isSummaryStep = currentStep === 4;
  const otherSteps = OTHER_OPTIONS_STEPS;
  const proposalStepIndex = 5 + otherSteps.length;
  const isProposalStep = currentStep === proposalStepIndex;
  const totalSteps = proposalStepIndex + 1;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep >= totalSteps - 1;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep((prev) => prev + 1);
  }, [currentStep, totalSteps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, []);

  const selectHomeType = useCallback((typeId) => {
    setSelections((prev) => {
      const same = prev.homeType === typeId;
      const newHomeType = same ? null : typeId;
      const defaultRooms = newHomeType
        ? (HOME_TYPE_ROOMS[newHomeType] || ["Living Room", "Bedroom", "Kitchen", "Bathroom"])
            .map((name) => ({
              id: nextRoomId(),
              name,
              devices: createDefaultDeviceConfig(),
            }))
        : [];
      return { homeType: newHomeType, rooms: defaultRooms };
    });
  }, []);

  const rooms = selections.rooms || [];

  const addRoom = useCallback(() => {
    setSelections((prev) => ({
      ...prev,
      rooms: [
        ...(prev.rooms || []),
        { id: nextRoomId(), name: "New Room", devices: createDefaultDeviceConfig() },
      ],
    }));
  }, []);

  const deleteRoom = useCallback((roomId) => {
    setSelections((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).filter((r) => r.id !== roomId),
    }));
  }, []);

  const renameRoom = useCallback((roomId, newName) => {
    setSelections((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) => (r.id === roomId ? { ...r, name: newName } : r)),
    }));
  }, []);

  const updateDevice = useCallback((roomId, deviceId, field, value) => {
    setSelections((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          devices: {
            ...r.devices,
            [deviceId]: { ...r.devices[deviceId], [field]: value },
          },
        };
      }),
    }));
  }, []);

  const toggleDevice = useCallback((roomId, deviceId) => {
    setSelections((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r) => {
        if (r.id !== roomId) return r;
        const current = r.devices[deviceId];
        return {
          ...r,
          devices: {
            ...r.devices,
            [deviceId]: { ...current, enabled: !current.enabled },
          },
        };
      }),
    }));
  }, []);

  const toggleOption = useCallback((stepId, optionId) => {
    setSelections((prev) => {
      const current = prev[stepId] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [stepId]: updated };
    });
  }, []);

  const selectedHomeType = selections.homeType || null;
  const otherStepIndex = currentStep - 5;
  const otherStep = otherSteps[otherStepIndex] || null;

  const updateProposalField = useCallback((field, value) => {
    setProposalForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /* ---- product recommendation fetch ---- */
  const fetchRecommendations = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    const recs = {};
    try {
      for (const room of rooms) {
        recs[room.id] = {};
        const roomDevices = room.devices || createDefaultDeviceConfig();
        for (const deviceType of DEVICE_TYPES) {
          const cfg = roomDevices[deviceType.id];
          if (!cfg || !cfg.enabled) continue;
          const terms = DEVICE_APPLICATION_MAP[deviceType.id] || [deviceType.label.toLowerCase()];
          let bestProducts = [];
          for (const term of terms) {
            try {
              const res = await productService.getProductsByApplication(term, 1, 4);
              let products = [];
              if (res && typeof res === "object") {
                products = res.data || res.products || [];
              }
              if (Array.isArray(products) && products.length > 0) {
                const sorted = products
                  .filter((p) => p && p.status === "active")
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0));
                bestProducts = sorted.slice(0, cfg.quantity || 1);
                break;
              }
            } catch {
              continue;
            }
          }
          recs[room.id][deviceType.id] = bestProducts;
        }
      }
      setRecommendations(recs);
    } catch (err) {
      setProductsError("Unable to load recommendations. Please continue.");
    } finally {
      setLoadingProducts(false);
    }
  }, [rooms]);

  useEffect(() => {
    if (isRecommendationsStep) {
      fetchRecommendations();
    }
  }, [isRecommendationsStep, fetchRecommendations]);

  const handleAddToCart = useCallback(async (productId) => {
    setAddingToCart(productId);
    try {
      await cartService.addToCart(productId, 1);
    } catch (err) {
      setProductsError("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  }, []);

  /* ---- Summary panel helpers ---- */
  const summaryItems = useMemo(() => {
    const items = [];
    rooms.forEach((room) => {
      const roomRecs = recommendations[room.id] || {};
      const deviceEntries = Object.entries(roomRecs).filter(([, products]) => Array.isArray(products) && products.length > 0);
      deviceEntries.forEach(([deviceId, products]) => {
        const deviceDef = DEVICE_TYPES.find((d) => d.id === deviceId);
        const cfg = room.devices?.[deviceId] || { enabled: true, quantity: 1, notes: "" };
        const qty = cfg.quantity || 1;
        products.forEach((product) => {
          const unitPrice = Number(product.price || 0);
          const discountPercent = Number(product.discount_percent || 0);
          const lineTotal = unitPrice * qty;
          const discountAmount = lineTotal * (discountPercent / 100);
          const finalLineTotal = lineTotal - discountAmount;
          items.push({
            id: `${room.id}-${deviceId}-${product.id}`,
            roomId: room.id,
            roomName: room.name,
            deviceLabel: deviceDef?.label || deviceId,
            productId: product.id,
            name: product.name,
            image_url: product.image_url,
            unitPrice,
            discountPercent,
            discountAmount,
            quantity: qty,
            lineTotal,
            finalLineTotal,
            product,
          });
        });
      });
    });
    return items;
  }, [rooms, recommendations]);

  const orderDiscount = useMemo(() => {
    const subtotal = summaryItems.reduce((s, i) => s + i.lineTotal, 0);
    return Number((subtotal * (Number(summaryDiscount) / 100)).toFixed(2));
  }, [summaryDiscount, summaryItems]);

  const estimatedTotal = useMemo(() => {
    const afterProductDiscounts = summaryItems.reduce((s, i) => s + i.finalLineTotal, 0);
    return Math.max(0, afterProductDiscounts - orderDiscount + Number(installationCharges || 0));
  }, [summaryItems, orderDiscount, installationCharges]);

  const handleSummaryQuantityChange = useCallback((roomId, deviceId, productId, qty) => {
    const nextQty = Math.max(1, Number(qty) || 1);
    updateDevice(roomId, deviceId, "quantity", nextQty);
  }, [updateDevice]);

  const handleSummaryRemove = useCallback((roomId, deviceId, productId) => {
    toggleDevice(roomId, deviceId);
  }, [toggleDevice]);

  const handleAddAllToCart = useCallback(async () => {
    if (summaryItems.length === 0) return;
    try {
      await Promise.all(summaryItems.map((item) => cartService.addToCart(item.productId, item.quantity)));
    } catch (err) {
      // ignore partial failures for demo
    }
  }, [summaryItems]);

  const subtotalForDisplay = useMemo(() => summaryItems.reduce((s, i) => s + i.lineTotal, 0), [summaryItems]);
  const totalProductDiscount = useMemo(() => summaryItems.reduce((s, i) => s + i.discountAmount, 0), [summaryItems]);

  /* ============================================================= */
  /*  RENDER                                                        */
  /* ============================================================= */
  return (
    <div className="min-h-screen bg-background text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Step {currentStep + 1} of {totalSteps}</span>
              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep ? "bg-indigo-500 w-6" : i < currentStep ? "bg-indigo-500/60" : "bg-slate-700"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {isHomeTypeStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Home className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Home Type</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Tell us about your home</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-10">Select the type of home or space you'd like to set up with smart automation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                  {HOME_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = selectedHomeType === type.id;
                    return (
                      <motion.button key={type.id} type="button" onClick={() => selectHomeType(type.id)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={`relative flex flex-col gap-1 p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${isSelected ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]" : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold text-sm block ${isSelected ? "text-white" : "text-slate-200"}`}>{type.label}</span>
                            <span className="text-xs text-slate-500 mt-0.5 block leading-snug">{type.description}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-indigo-500" : "border-slate-700"}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}

            {isRoomsStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <DoorOpen className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Rooms</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Customise your rooms</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">Add, rename, or remove rooms.</p>
                <div className="flex items-center justify-between mb-6 ml-16">
                  <span className="text-sm text-slate-500">{rooms.length} {rooms.length === 1 ? "room" : "rooms"} configured</span>
                  <motion.button type="button" onClick={addRoom} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-sm font-medium transition-all duration-200 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add Room
                  </motion.button>
                </div>
                {rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    {rooms.map((room, idx) => {
                      const RoomIcon = getRoomIcon(room.name);
                      const colorClass = ROOM_COLORS[idx % ROOM_COLORS.length];
                      const [bgFromTo, colorPart] = colorClass.split(" border-");
                      return (
                        <motion.div key={room.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className={`relative p-4 rounded-2xl bg-gradient-to-br ${bgFromTo} border ${colorPart ? `border-${colorPart}` : "border-slate-800"} bg-slate-900/80`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center flex-shrink-0">
                              <RoomIcon className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <input type="text" value={room.name} onChange={(e) => renameRoom(room.id, e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 text-sm font-semibold text-white placeholder-slate-500 outline-none transition-colors py-0.5" placeholder="Room name" />
                            </div>
                            <motion.button type="button" onClick={() => deleteRoom(room.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0 cursor-pointer" title="Delete room">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 mb-12 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30">
                    <DoorOpen className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-500 text-sm font-medium">No rooms yet. Click "Add Room" to get started.</p>
                  </div>
                )}
              </>
            )}

            {isDevicesStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Devices</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Select devices per room</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">Enable the smart devices you need for each room.</p>
                <div className="space-y-6 mb-12">
                  {rooms.map((room) => {
                    const RoomIcon = getRoomIcon(room.name);
                    const roomDevices = room.devices || createDefaultDeviceConfig();
                    const enabledCount = Object.values(roomDevices).filter((d) => d.enabled).length;
                    return (
                      <motion.div key={room.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/60">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <RoomIcon className="w-4 h-4 text-slate-300" />
                          </div>
                          <span className="text-sm font-semibold text-white">{room.name}</span>
                          {enabledCount > 0 && (
                            <span className="ml-auto text-xs text-indigo-400 font-medium">{enabledCount} device{enabledCount !== 1 ? "s" : ""} selected</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {DEVICE_TYPES.map((device) => {
                            const DeviceIcon = device.icon;
                            const config = roomDevices[device.id] || { enabled: false, quantity: 1, notes: "" };
                            return (
                              <div key={device.id} className={`rounded-xl border transition-all duration-200 ${config.enabled ? "border-indigo-500/30 bg-indigo-500/5" : "border-slate-800/60 bg-slate-900/40"}`}>
                                <div className="flex items-center gap-3 px-4 py-3">
                                  <button type="button" onClick={() => toggleDevice(room.id, device.id)}
                                    className={`w-10 h-6 rounded-full border-2 flex items-center transition-all duration-200 flex-shrink-0 cursor-pointer ${config.enabled ? "border-indigo-500 bg-indigo-500" : "border-slate-700 bg-slate-800"}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${config.enabled ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                                  </button>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.enabled ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"}`}>
                                    <DeviceIcon className="w-4 h-4" />
                                  </div>
                                  <span className={`text-sm font-medium flex-1 ${config.enabled ? "text-white" : "text-slate-400"}`}>{device.label}</span>
                                  {config.enabled && (
                                    <div className="flex items-center gap-1.5">
                                      <button type="button" onClick={() => updateDevice(room.id, device.id, "quantity", Math.max(1, (config.quantity || 1) - 1))}
                                        className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-semibold text-white">{config.quantity || 1}</span>
                                      <button type="button" onClick={() => updateDevice(room.id, device.id, "quantity", (config.quantity || 1) + 1)}
                                        className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {config.enabled && (
                                  <div className="px-4 pb-3">
                                    <input type="text" value={config.notes || ""}
                                      onChange={(e) => updateDevice(room.id, device.id, "notes", e.target.value)}
                                      placeholder="Add notes..."
                                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/*  Product Recommendations                                 */}
            {/* ========================================================= */}
            {isRecommendationsStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Products</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Recommended for your plan</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">Based on your selected devices, here are compatible products from our shop.</p>

                {productsError && (
                  <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">{productsError}</div>
                )}

                {loadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8 mb-12">
                    {rooms.map((room) => {
                      const RoomIcon = getRoomIcon(room.name);
                      const roomRecs = recommendations[room.id] || {};
                      const deviceEntries = Object.entries(roomRecs).filter(([, products]) => Array.isArray(products) && products.length > 0);
                      const hasRecs = deviceEntries.length > 0;
                      return (
                        <div key={room.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                              <RoomIcon className="w-4 h-4 text-slate-300" />
                            </div>
                            <span className="text-sm font-semibold text-white">{room.name}</span>
                          </div>
                          {hasRecs ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {deviceEntries.map(([deviceId, products]) => {
                                const deviceDef = DEVICE_TYPES.find((d) => d.id === deviceId);
                                if (!deviceDef) return null;
                                const DeviceIcon = deviceDef.icon;
                                const productList = Array.isArray(products) && products.length > 0 ? products.slice(0, 3) : [];
                                return (
                                  <div key={deviceId} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <DeviceIcon className="w-3.5 h-3.5 text-indigo-400" />
                                      </div>
                                      <span className="text-xs font-bold text-indigo-400">{deviceDef.label}</span>
                                    </div>
                                    <div className="space-y-2">
                                      {productList.length > 0 ? (
                                        productList.map((product) => (
                                          <div key={product.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                                            {product.image_url ? (
                                              <img src={product.image_url} alt={product.name || "Product"} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                <Cpu className="w-4 h-4 text-slate-600" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-slate-200 truncate">{product.name}</p>
                                              <p className="text-[11px] text-slate-500 line-clamp-1">{product.category_name || "IoT Hardware"}</p>
                                              <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-indigo-400 font-bold">₹{Number(product.price || 0).toFixed(2)}</span>
                                                {product.rating ? (
                                                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                                                    <Star className="w-3 h-3 fill-amber-400" /> {Number(product.rating).toFixed(1)}
                                                  </span>
                                                ) : null}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={addingToCart === product.id}
                                                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
                                              >
                                                <ShoppingCart className="w-3 h-3" />
                                                {addingToCart === product.id ? "Adding..." : "Add to Cart"}
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[11px] text-slate-600 italic py-1">No products found</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No matching products available.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/*  Budget & Cart / Summary                                 */}
            {/* ========================================================= */}
            {isSummaryStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step 5</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Budget & Cart</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">Review selections, adjust quantities, and add products to cart.</p>

                {summaryItems.length === 0 ? (
                  <div className="mb-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
                    <p className="text-sm text-slate-500">No products selected yet. Go back to recommendations to select devices/products.</p>
                  </div>
                ) : (
                  <div className="space-y-8 mb-12">
                    {/* Selected Rooms */}
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-2 mb-3">
                        <Home className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Selected Rooms</span>
                      </div>
                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const RoomIcon = getRoomIcon(room.name);
                          return (
                            <div key={room.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/60 mr-2 mb-2">
                              <RoomIcon className="w-4 h-4 text-slate-300" />
                              <span className="text-xs font-medium text-slate-200">{room.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Products */}
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Selected Products</span>
                      </div>
                      <div className="space-y-3">
                        {summaryItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                            <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1" />
                              ) : (
                                <Cpu className="w-5 h-5 text-slate-700" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-200 truncate">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.roomName} • {item.deviceLabel}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400">₹{item.unitPrice.toFixed(2)} each</span>
                                {item.discountPercent > 0 && (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <Percent className="w-3 h-3" /> {item.discountPercent}% OFF · -₹{item.discountAmount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button type="button" onClick={() => handleSummaryQuantityChange(item.roomId, item.deviceLabel, item.productId, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                              <button type="button" onClick={() => handleSummaryQuantityChange(item.roomId, item.deviceLabel, item.productId, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button type="button" onClick={() => handleSummaryRemove(item.roomId, item.deviceLabel, item.productId)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Discounts and Charges */}
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-2 mb-3">
                        <Percent className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Discounts & Charges</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Product Discounts</span>
                            <span className="text-[10px] text-slate-600">Auto-applied from product offers</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">-₹{totalProductDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Order Discount (%)</span>
                            <span className="text-[10px] text-slate-600">Additional discount on total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" max="100" value={summaryDiscount}
                              onChange={(e) => setSummaryDiscount(Number(e.target.value || 0))}
                              className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white text-center outline-none focus:border-indigo-500/50" />
                            <span className="text-xs text-slate-500">%</span>
                          </div>
                        </div>
                        {orderDiscount > 0 && (
                          <div className="flex items-center justify-between text-xs text-slate-400 pl-3">
                            <span>Order discount amount</span>
                            <span className="text-emerald-400 font-semibold">-₹{orderDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Installation Charges (optional)</span>
                            <span className="text-[10px] text-slate-600">Service fee for setup & commissioning</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">₹</span>
                            <input type="number" min="0" step="0.01" value={installationCharges}
                              onChange={(e) => setInstallationCharges(Number(e.target.value || 0))}
                              className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white text-right outline-none focus:border-indigo-500/50" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Total */}
                    <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Estimated Total</span>
                        </div>
                        <span className="text-2xl font-black text-white font-mono tracking-tight">₹{estimatedTotal.toFixed(2)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/60">Subtotal: ₹{subtotalForDisplay.toFixed(2)}</span>
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Product Savings: -₹{totalProductDiscount.toFixed(2)}</span>
                        {orderDiscount > 0 && (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Order Savings: -₹{orderDiscount.toFixed(2)}</span>
                        )}
                        {Number(installationCharges) > 0 && (
                          <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">Installation: +₹{Number(installationCharges).toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleAddAllToCart}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider py-4 transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.97]">
                        <ShoppingCart className="w-4 h-4" /> Add All to Cart
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/*  FINAL STEP — Proposal                                   */}
            {/* ========================================================= */}
            {isProposalStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Proposal</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">Smart Home Proposal</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">Review your complete plan and take action.</p>

                <div className="space-y-6 mb-12">
                  {/* Customer Details */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Customer Details</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">Full Name</label>
                        <input type="text" value={proposalForm.fullName} onChange={(e) => updateProposalField("fullName", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500/50" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">Email</label>
                        <input type="email" value={proposalForm.email} onChange={(e) => updateProposalField("email", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500/50" placeholder="you@example.com" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">Phone</label>
                        <input type="tel" value={proposalForm.phone} onChange={(e) => updateProposalField("phone", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500/50" placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">City</label>
                        <input type="text" value={proposalForm.city} onChange={(e) => updateProposalField("city", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500/50" placeholder="City" />
                      </div>
                    </div>
                  </div>

                  {/* Home Type */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Home Type</span>
                    </div>
                    <p className="text-sm text-slate-300">{selectedHomeType ? (HOME_TYPES.find((t) => t.id === selectedHomeType)?.label || selectedHomeType) : "Not selected"}</p>
                  </div>

                  {/* Room Details */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <DoorOpen className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Room Details</span>
                    </div>
                    {rooms.length > 0 ? (
                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const RoomIcon = getRoomIcon(room.name);
                          const enabledDevices = DEVICE_TYPES.filter((d) => (room.devices || {})[d.id]?.enabled);
                          return (
                            <div key={room.id} className="px-3 py-2 rounded-lg bg-slate-800/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-300 font-medium">{room.name}</span>
                              </div>
                              {enabledDevices.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {enabledDevices.map((d) => {
                                    const cfg = (room.devices || {})[d.id];
                                    return (
                                      <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-[10px] text-indigo-300">
                                        {d.label} ×{cfg.quantity || 1}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No rooms configured</p>
                    )}
                  </div>

                  {/* Recommended Products Summary */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Recommended Products</span>
                    </div>
                    {summaryItems.length > 0 ? (
                      <div className="space-y-2">
                        {summaryItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{item.name} × {item.quantity}</span>
                            <span className="text-white font-semibold">₹{item.finalLineTotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No products selected</p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Percent className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Price Breakdown</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-white font-semibold">₹{subtotalForDisplay.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Product Discounts</span>
                        <span className="text-emerald-400 font-semibold">-₹{totalProductDiscount.toFixed(2)}</span>
                      </div>
                      {orderDiscount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Order Discount</span>
                          <span className="text-emerald-400 font-semibold">-₹{orderDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {Number(installationCharges) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Installation Charges</span>
                          <span className="text-amber-400 font-semibold">+₹{Number(installationCharges).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm font-bold border-t border-slate-800 pt-2 mt-2">
                        <span className="text-white">Estimated Total</span>
                        <span className="text-white font-mono">₹{estimatedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button type="button" onClick={handleAddAllToCart}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider py-4 transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.97]">
                    <ShoppingCart className="w-4 h-4" /> Add All Products to Cart
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button type="button" onClick={() => alert("PDF Quote download will be implemented by backend integration.")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider py-3 transition-all">
                      Download PDF Quote
                    </button>
                    <button type="button" onClick={() => alert("Email Quote will be implemented by backend integration.")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider py-3 transition-all">
                      Email Quote
                    </button>
                    <button type="button" onClick={() => alert("Site visit request will be implemented by backend integration.")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider py-3 transition-all">
                      Request Site Visit
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/*  Other multi-select options                              */}
            {/* ========================================================= */}
            {!isHomeTypeStep && !isRoomsStep && !isDevicesStep && !isRecommendationsStep && !isSummaryStep && !isProposalStep && otherStep && (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <otherStep.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{otherStep.label}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">{otherStep.title}</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-10">{otherStep.description}</p>

                {otherStep.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    {otherStep.options.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = (selections[otherStep.id] || []).includes(option.id);
                      return (
                        <motion.button key={option.id} type="button"
                          onClick={() => toggleOption(otherStep.id, option.id)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className={`relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                          }`}>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
                            <OptionIcon className="w-5 h-5" />
                          </div>
                          <span className={`font-semibold text-sm ${isSelected ? "text-white" : "text-slate-300"}`}>{option.label}</span>
                          <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-700"}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {otherStep.id === "review" && (
                  <div className="mb-12 space-y-6">
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-3 mb-2">
                        <Home className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Home Type</span>
                      </div>
                      {selectedHomeType ? (
                        <p className="text-sm text-slate-300">{HOME_TYPES.find((t) => t.id === selectedHomeType)?.label || selectedHomeType}</p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No selection made</p>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                      <div className="flex items-center gap-3 mb-3">
                        <DoorOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Rooms</span>
                      </div>
                      {rooms.length > 0 ? (
                        <div className="space-y-3">
                          {rooms.map((room) => {
                            const roomDevices = room.devices || {};
                            const enabledDevices = DEVICE_TYPES.filter((d) => roomDevices[d.id]?.enabled);
                            return (
                              <div key={room.id} className="px-3 py-2 rounded-lg bg-slate-800/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-slate-300 font-medium">{room.name}</span>
                                </div>
                                {enabledDevices.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {enabledDevices.map((d) => {
                                      const cfg = roomDevices[d.id];
                                      return (
                                        <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-[10px] text-indigo-300">
                                          {d.label} ×{cfg.quantity || 1}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-600 italic">No devices selected</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No rooms configured</p>
                      )}
                    </div>

                    {otherSteps.filter((s) => s.id !== "review").map((s) => {
                      const selectedIds = selections[s.id] || [];
                      const selectedLabels = selectedIds.map((id) => s.options.find((o) => o.id === id)?.label || id).join(", ");
                      return (
                        <div key={s.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                          <div className="flex items-center gap-3 mb-2">
                            <s.icon className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{s.label}</span>
                          </div>
                          {selectedIds.length > 0 ? (
                            <p className="text-sm text-slate-300">{selectedLabels}</p>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No selections made</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-800/60">
          <div>
            {!isFirstStep && (
              <motion.button type="button" onClick={handlePrev}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 font-medium text-sm transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Previous
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-transparent font-medium text-sm transition-all duration-200 cursor-pointer">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save & Continue Later</span>
              <span className="sm:hidden">Save</span>
            </button>
            <motion.button type="button" onClick={handleNext}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                isLastStep
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              }`}>
              {isLastStep ? (
                <><Check className="w-4 h-4" /> Get Proposal </>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}