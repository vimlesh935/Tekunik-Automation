import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { smartHomeStepService } from "../services/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  User,
  DoorOpen,
  Cpu,
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  Lightbulb,
  Fan,
  Sun,
  Thermometer,
  Tv,
  Plug,
  Lock,
  Bell,
  Radio,
  Shield,
  Camera,
  WifiIcon,
  Plus,
  Trash2,
  Minus,
  Building2,
  Briefcase,
  Warehouse,
  Pencil,
  Bed,
  Sofa,
  CookingPot,
  Bath,
  Trees,
  Monitor,
  Car,
  UtensilsCrossed,
  Sparkles,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
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

const STEP_LABELS = [
  { id: 1, label: "Personal Details", icon: User },
  { id: 2, label: "Home Type", icon: Home },
  { id: 3, label: "Rooms", icon: DoorOpen },
  { id: 4, label: "Devices", icon: Cpu },
  { id: 5, label: "Review & Submit", icon: ClipboardList },
];

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
  return DoorOpen;
}

function createDefaultDeviceConfig() {
  return Object.fromEntries(
    DEVICE_TYPES.map((d) => [d.id, { enabled: false, quantity: 1, notes: "" }])
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function SmartHomePlanner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [resumeEmail, setResumeEmail] = useState("");
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Step 1: Personal Details
  const [personal, setPersonal] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
  });

  // Step 2: Home Type
  const [homeType, setHomeType] = useState(null);

  // Step 3: Rooms
  const [rooms, setRooms] = useState([]);

  // Step 4: Devices
  const [expandedRoom, setExpandedRoom] = useState(null);

  // Step 5: Notes
  const [notes, setNotes] = useState("");

  const totalSteps = STEP_LABELS.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Load session from localStorage on mount — only resume actively-editing sessions
  useEffect(() => {
    const stored = localStorage.getItem("shp_sessionId");
    if (stored) {
      smartHomeStepService.getSession(Number(stored)).then((res) => {
        const data = res?.data || res;
        if (data && data.id && data.wizard_status === "In Progress") {
          setSessionId(data.id);
          if (data.full_name) setPersonal({ fullName: data.full_name || "", email: data.email || "", phone: data.phone || "", city: data.city || "" });
          if (data.home_type) setHomeType(data.home_type);
          if (data.rooms_json) {
            try {
              const parsed = typeof data.rooms_json === "string" ? JSON.parse(data.rooms_json) : data.rooms_json;
              setRooms(parsed);
            } catch {}
          }
          if (data.additional_notes) setNotes(data.additional_notes);
          if (data.current_step) {
            const savedStep = Math.max(0, Math.min(totalSteps - 1, data.current_step - 1));
            setCurrentStep(savedStep);
          }
        } else {
          // Stale session — clear it so the next save creates a fresh proposal
          localStorage.removeItem("shp_sessionId");
        }
      }).catch(() => {
        localStorage.removeItem("shp_sessionId");
      }).finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  // Validate current step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return personal.fullName.trim() && personal.email.trim() && personal.phone.trim();
      case 1: return homeType !== null;
      case 2: return rooms.length > 0;
      case 3: return rooms.length > 0; // devices are optional
      case 4: return true;
      default: return true;
    }
  }, [currentStep, personal, homeType, rooms]);

  // Save current step to database
  const saveCurrentStep = useCallback(async (stepOverride, wizardStatus) => {
    const step = stepOverride !== undefined ? stepOverride : currentStep + 1;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      let data = {};

      switch (step) {
        case 1:
          data = { full_name: personal.fullName, email: personal.email, phone: personal.phone, city: personal.city };
          break;
        case 2:
          data = { home_type: homeType };
          break;
        case 3:
          data = { rooms_json: rooms };
          break;
        case 4:
          data = { devices_json: rooms };
          break;
        case 5:
          data = { notes, status: "Pending" };
          break;
        default:
          break;
      }

      if (wizardStatus) {
        data.wizardStatus = wizardStatus;
      }

      const res = await smartHomeStepService.saveStep(sessionId, step, data);
      const result = res?.data || res;

      if (result?.id && !wizardStatus) {
        setSessionId(result.id);
        localStorage.setItem("shp_sessionId", String(result.id));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save step:", err);
      setSaveError(err?.message || "Failed to save progress. Please try again.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentStep, sessionId, personal, homeType, rooms, notes]);

  const handleNext = useCallback(async () => {
    try {
      await saveCurrentStep();
      setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
    } catch (err) {
      // Step not saved — do NOT advance
    }
  }, [saveCurrentStep, totalSteps]);

  const handlePrev = useCallback(async () => {
    try {
      await saveCurrentStep();
      setCurrentStep((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Save failed — stay on current step
    }
  }, [saveCurrentStep]);

  // Home type selection
  const selectHomeType = useCallback((typeId) => {
    const same = homeType === typeId;
    const newHomeType = same ? null : typeId;
    setHomeType(newHomeType);
    const defaultRooms = newHomeType
      ? (HOME_TYPE_ROOMS[newHomeType] || ["Living Room", "Bedroom", "Kitchen", "Bathroom"])
          .map((name) => ({ id: nextRoomId(), name, devices: createDefaultDeviceConfig() }))
      : [];
    setRooms(defaultRooms);
  }, [homeType]);

  const addRoom = useCallback(() => {
    setRooms((prev) => [...prev, { id: nextRoomId(), name: "New Room", devices: createDefaultDeviceConfig() }]);
  }, []);

  const deleteRoom = useCallback((roomId) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  }, []);

  const renameRoom = useCallback((roomId, newName) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, name: newName } : r)));
  }, []);

  const toggleDevice = useCallback((roomId, deviceId) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const current = r.devices[deviceId];
        return { ...r, devices: { ...r.devices, [deviceId]: { ...current, enabled: !current.enabled } } };
      })
    );
  }, []);

  const updateDeviceQty = useCallback((roomId, deviceId, delta) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const current = r.devices[deviceId];
        return {
          ...r,
          devices: {
            ...r.devices,
            [deviceId]: { ...current, quantity: Math.max(1, (current.quantity || 1) + delta) },
          },
        };
      })
    );
  }, []);

  const toggleRoomExpand = useCallback((roomId) => {
    setExpandedRoom((prev) => (prev === roomId ? null : roomId));
  }, []);

  // Handle final submission
  const handleFinalSubmit = useCallback(async () => {
    setSubmitting(true);
    setSaveError("");
    try {
      // Save step 5 and mark as submitted
      await saveCurrentStep(5);
      localStorage.removeItem("shp_sessionId");
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      // saveError is already set by saveCurrentStep's catch
    } finally {
      setSubmitting(false);
    }
  }, [saveCurrentStep]);

  // Back to Home — save current data, end session, navigate home
  const handleBackToHome = useCallback(async () => {
    // Save all completed data with wizard_status = 'Draft' to close the session
    try {
      await saveCurrentStep(undefined, "Draft");
    } catch (err) {
      // Save best-effort — still clear session and navigate
    }
    localStorage.removeItem("shp_sessionId");
    setSessionId(null);
    navigate("/home");
  }, [saveCurrentStep, navigate]);

  // Device summary for review step
  const deviceSummaryItems = useMemo(() => {
    const items = [];
    rooms.forEach((room) => {
      DEVICE_TYPES.forEach((deviceType) => {
        const cfg = room.devices?.[deviceType.id];
        if (!cfg || !cfg.enabled) return;
        items.push({
          id: `${room.id}-${deviceType.id}`,
          roomName: room.name,
          deviceLabel: deviceType.label,
          quantity: cfg.quantity || 1,
        });
      });
    });
    return items;
  }, [rooms]);

  const totalDeviceUnits = useMemo(() => deviceSummaryItems.reduce((sum, i) => sum + i.quantity, 0), [deviceSummaryItems]);

  // Count enabled devices per room
  const getEnabledCount = (room) => Object.values(room.devices || {}).filter((d) => d.enabled).length;

  /* ============================================================= */
  /*  RENDER                                                        */
  /* ============================================================= */
  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Your Smart Home Plan is Submitted!</h2>
          <p className="text-slate-400 mb-8">
            Thank you! Our team will review your requirements and get back to you within 24 hours with a personalised quote.
          </p>
          <button onClick={() => { localStorage.removeItem("shp_sessionId"); navigate("/home"); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={handleBackToHome} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>
            <div className="flex items-center gap-3">
              {/* Step indicator dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {STEP_LABELS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? "bg-indigo-500 w-6" : i < currentStep ? "bg-indigo-500/60" : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium">Step {currentStep + 1} of {totalSteps}</span>
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

        {/* Step Label Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            {currentStep < totalSteps && (() => {
              const StepIcon = STEP_LABELS[currentStep].icon;
              return <StepIcon className="w-6 h-6 text-indigo-400" />;
            })()}
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Step {currentStep + 1}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">{STEP_LABELS[currentStep]?.label}</h2>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* ========================================================= */}
            {/*  STEP 1 — PERSONAL DETAILS                                */}
            {/* ========================================================= */}
            {currentStep === 0 && (
              <>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">
                  Tell us about yourself so we can reach out with your personalised smart home plan.
                </p>

                {/* Resume prompt — shown when no session is loaded */}
                {!sessionId && !initialLoading && (
                  <div className="ml-16 mb-6 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                    <button
                      type="button"
                      onClick={() => setShowResume(!showResume)}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {showResume ? "Hide" : "Already started? Resume your plan"}
                    </button>
                    {showResume && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="email"
                          value={resumeEmail}
                          onChange={(e) => { setResumeEmail(e.target.value); setResumeError(""); }}
                          placeholder="Enter your email to resume"
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500/50 placeholder-slate-600"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!resumeEmail.trim()) return;
                            setResuming(true);
                            setResumeError("");
                            try {
                              const res = await smartHomeStepService.resumeSession(resumeEmail.trim());
                              const result = res?.data || res;
                              if (result && result.id) {
                                setSessionId(result.id);
                                localStorage.setItem("shp_sessionId", String(result.id));
                                if (result.full_name) setPersonal({ fullName: result.full_name || "", email: result.email || "", phone: result.phone || "", city: result.city || "" });
                                if (result.home_type) setHomeType(result.home_type);
                                if (result.rooms_json) {
                                  try {
                                    const parsed = typeof result.rooms_json === "string" ? JSON.parse(result.rooms_json) : result.rooms_json;
                                    setRooms(parsed);
                                  } catch {}
                                }
                                if (result.additional_notes) setNotes(result.additional_notes);
                                if (result.current_step) {
                                  const savedStep = Math.max(0, Math.min(totalSteps - 1, result.current_step - 1));
                                  setCurrentStep(savedStep);
                                }
                                setShowResume(false);
                              } else {
                                setResumeError("No saved plan found for this email.");
                              }
                            } catch (err) {
                              setResumeError("Failed to find plan. Please check your email.");
                            } finally {
                              setResuming(false);
                            }
                          }}
                          disabled={resuming || !resumeEmail.trim()}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                        >
                          {resuming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding...</> : "Resume"}
                        </button>
                      </div>
                    )}
                    {resumeError && <p className="mt-2 text-xs text-rose-400">{resumeError}</p>}
                  </div>
                )}

                <div className="ml-16 space-y-4 mb-12">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={personal.fullName}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={personal.email}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">City</label>
                    <input
                      type="text"
                      value={personal.city}
                      onChange={(e) => setPersonal((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/*  STEP 2 — HOME TYPE                                       */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">
                  Select the type of home or space you'd like to set up with smart automation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 ml-16">
                  {HOME_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = homeType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        type="button"
                        onClick={() => selectHomeType(type.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex flex-col gap-1 p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
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

            {/* ========================================================= */}
            {/*  STEP 3 — ROOMS                                           */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-6">Customise your rooms — add, rename, or remove as needed.</p>
                <div className="flex items-center justify-between mb-6 ml-16">
                  <span className="text-sm text-slate-500">{rooms.length} {rooms.length === 1 ? "room" : "rooms"}</span>
                  <motion.button
                    type="button"
                    onClick={addRoom}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-sm font-medium transition-all duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Room
                  </motion.button>
                </div>
                {rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 ml-16">
                    {rooms.map((room, idx) => {
                      const RoomIcon = getRoomIcon(room.name);
                      const [bgFromTo] = ROOM_COLORS[idx % ROOM_COLORS.length].split(" border-");
                      return (
                        <motion.div
                          key={room.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`relative p-4 rounded-2xl bg-gradient-to-br ${bgFromTo} border border-slate-800 bg-slate-900/80`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center flex-shrink-0">
                              <RoomIcon className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={room.name}
                                onChange={(e) => renameRoom(room.id, e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 text-sm font-semibold text-white placeholder-slate-500 outline-none transition-colors py-0.5"
                                placeholder="Room name"
                              />
                            </div>
                            <motion.button
                              type="button"
                              onClick={() => deleteRoom(room.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0 cursor-pointer"
                              title="Delete room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 mb-12 ml-16 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30">
                    <DoorOpen className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-500 text-sm font-medium">No rooms yet. Click "Add Room" to get started.</p>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/*  STEP 4 — DEVICES                                         */}
            {/* ========================================================= */}
            {currentStep === 3 && (
              <>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-6">
                  Enable the smart devices you need for each room. Click a room to expand and configure.
                </p>

                {/* Summary bar */}
                <div className="ml-16 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center">
                    <span className="text-lg font-bold text-indigo-400">{rooms.length}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Rooms</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center">
                    <span className="text-lg font-bold text-indigo-400">{deviceSummaryItems.length}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Devices Selected</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center">
                    <span className="text-lg font-bold text-indigo-400">{totalDeviceUnits}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total Units</p>
                  </div>
                </div>

                {/* Accordion */}
                <div className="space-y-3 mb-12 ml-16">
                  {rooms.map((room) => {
                    const RoomIcon = getRoomIcon(room.name);
                    const enabledCount = getEnabledCount(room);
                    const isExpanded = expandedRoom === room.id;
                    return (
                      <div
                        key={room.id}
                        className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                          isExpanded
                            ? "border-indigo-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleRoomExpand(room.id)}
                          className="w-full flex items-center gap-3 p-4 text-left cursor-pointer transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <RoomIcon className="w-4 h-4 text-slate-300" />
                          </div>
                          <span className="text-sm font-semibold text-white flex-1">{room.name}</span>
                          {enabledCount > 0 && (
                            <span className="text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                              {enabledCount} selected
                            </span>
                          )}
                          <div className={`w-6 h-6 rounded-lg bg-slate-800/80 flex items-center justify-center transition-transform duration-300 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-slate-800/60">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                  {DEVICE_TYPES.map((device) => {
                                    const DeviceIcon = device.icon;
                                    const config = room.devices?.[device.id] || { enabled: false, quantity: 1, notes: "" };
                                    return (
                                      <div
                                        key={device.id}
                                        className={`rounded-xl border transition-all duration-200 ${
                                          config.enabled
                                            ? "border-indigo-500/30 bg-indigo-500/5"
                                            : "border-slate-800/60 bg-slate-900/40"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                                          <button
                                            type="button"
                                            onClick={() => toggleDevice(room.id, device.id)}
                                            className={`w-9 h-5 rounded-full border-2 flex items-center transition-all duration-200 flex-shrink-0 cursor-pointer ${
                                              config.enabled
                                                ? "border-indigo-500 bg-indigo-500"
                                                : "border-slate-700 bg-slate-800"
                                            }`}
                                          >
                                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                              config.enabled ? "translate-x-[17px]" : "translate-x-[2px]"
                                            }`} />
                                          </button>
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            config.enabled ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
                                          }`}>
                                            <DeviceIcon className="w-3.5 h-3.5" />
                                          </div>
                                          <span className={`text-xs font-medium flex-1 ${config.enabled ? "text-white" : "text-slate-400"}`}>
                                            {device.label}
                                          </span>
                                          {config.enabled && (
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => updateDeviceQty(room.id, device.id, -1)}
                                                className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                                              >
                                                <Minus className="w-2.5 h-2.5" />
                                              </button>
                                              <span className="w-5 text-center text-[11px] font-semibold text-white">{config.quantity || 1}</span>
                                              <button
                                                type="button"
                                                onClick={() => updateDeviceQty(room.id, device.id, 1)}
                                                className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                                              >
                                                <Plus className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {rooms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30">
                      <Cpu className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-slate-500 text-sm font-medium">No rooms configured yet. Go back and add rooms first.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/*  STEP 5 — REVIEW & SUBMIT                                 */}
            {/* ========================================================= */}
            {currentStep === 4 && (
              <>
                <p className="text-slate-400 text-sm sm:text-base ml-16 mb-8">
                  Review your complete smart home plan before submitting.
                </p>

                <div className="space-y-6 mb-12 ml-16">
                  {/* Personal Details */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Contact Details</span>
                    </div>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p><span className="text-slate-500">Name:</span> {personal.fullName}</p>
                      <p><span className="text-slate-500">Email:</span> {personal.email}</p>
                      <p><span className="text-slate-500">Phone:</span> {personal.phone}</p>
                      <p><span className="text-slate-500">City:</span> {personal.city || "—"}</p>
                    </div>
                  </div>

                  {/* Home Type */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Home Type</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {homeType ? (HOME_TYPES.find((t) => t.id === homeType)?.label || homeType) : "Not selected"}
                    </p>
                  </div>

                  {/* Rooms */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <DoorOpen className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Rooms ({rooms.length})</span>
                    </div>
                    {rooms.length > 0 ? (
                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const enabledDevices = DEVICE_TYPES.filter((d) => room.devices?.[d.id]?.enabled);
                          return (
                            <div key={room.id} className="px-3 py-2 rounded-lg bg-slate-800/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-300 font-medium">{room.name}</span>
                              </div>
                              {enabledDevices.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {enabledDevices.map((d) => {
                                    const cfg = room.devices[d.id];
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

                  {/* Device Summary */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Device Summary</span>
                    </div>
                    {deviceSummaryItems.length > 0 ? (
                      <div className="space-y-2">
                        {deviceSummaryItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{item.deviceLabel} × {item.quantity} <span className="text-slate-500">({item.roomName})</span></span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-sm font-bold border-t border-slate-800 pt-2 mt-2">
                          <span className="text-white">Total Units</span>
                          <span className="text-white font-mono">{totalDeviceUnits}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No devices selected</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Additional Notes</span>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements or preferences..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500/50 placeholder-slate-600 resize-none"
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-800/60">
          <div>
            {!isFirstStep && (
              <motion.button
                type="button"
                onClick={handlePrev}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 font-medium text-sm transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveError && (
              <span className="flex items-center gap-1.5 text-rose-400 text-xs font-medium max-w-[200px] truncate" title={saveError}>
                <AlertCircle className="w-3.5 h-3.5" /> {saveError}
              </span>
            )}
            {saveSuccess && !saveError && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <Save className="w-3.5 h-3.5" /> Saved
              </span>
            )}

            {isLastStep ? (
              <motion.button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Submit Plan</>
                )}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Next</>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}