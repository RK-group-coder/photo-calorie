import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Settings, 
  Flame, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Utensils,
  X,
  Zap,
  CheckCircle2,
  Home,
  Activity,
  History,
  Bell,
  Scan,
  TrendingUp,
  Target,
  ArrowRight,
  RefreshCcw,
  Plus,
  Image as ImageIcon,
  Info,
  User,
  Heart,
  HelpCircle,
  PenLine,
  Shield,
  LogOut,
  Share,
  PlusSquare,
  Eye,
  EyeOff,
  Mail,
  MailOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// --- Types ---
interface FoodLog {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
  imageUrl: string;
  notes?: string;
}

// --- Components ---

const CircularProgress = ({ consumed, target }: { consumed: number, target: number }) => {
  const progress = isNaN(consumed) || isNaN(target) || target <= 0 ? 0 : (consumed / target);
  const percentage = Math.min(progress * 100, 100);
  const color = "#f59e0b";
  const strokeWidth = 12;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-44 h-44 rotate-[-90deg]">
          <circle
            cx="88" cy="88" r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="88" cy="88" r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
};

function App() {
  // State
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'scan' | 'target' | 'settings'>('home');
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'food' | 'barcode' | 'photo'>('food');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [showHistoryGuide, setShowHistoryGuide] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [docModalType, setDocModalType] = useState<'help' | 'privacy' | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStep, setAuthStep] = useState<'welcome' | 'form'>('welcome');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Target Calc States
  const [isCalculatingTarget, setIsCalculatingTarget] = useState(false);
  const [showTargetResults, setShowTargetResults] = useState(false);
  const [savedTarget, setSavedTarget] = useState(2000);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
    image: null as string | null
  });

  // User Profile for TDEE
  const [userProfile, setUserProfile] = useState({
    name: '',
    avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // 專業灰色剪影
    email: 'abhi1322@gmail.com',
    phone: '',
    password: '00000000',
    gender: 'male',
    age: 25,
    height: 175,
    weight: 70,
    activity: 1.2,
    goal: 'maintain',
    hasSetTarget: false,
    targetCalories: 2000
  });

  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
  const [adminMsgFormData, setAdminMsgFormData] = useState({ title: '', content: '' });
  const [isAdminSending, setIsAdminSending] = useState(false);
  const [isBroadcastingGlobal, setIsBroadcastingGlobal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Real-time Camera Lifecycle
  useEffect(() => {
    if (isCapturing && !selectedImage && !analysisResult) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1920 } }
          });
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access failed:", err);
        }
      };
      startCamera();
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    }
  }, [isCapturing, selectedImage, analysisResult]);

  // Persistence & Session Restore
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        loadUserData(session.user.id);
      }
    };
    restoreSession();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUserProfile(prev => ({
          ...prev,
          name: profile.name || '',
          avatar: profile.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          email: profile.email || '',
          phone: profile.phone || '',
          gender: profile.gender || 'male',
          age: Number(profile.age) || 25,
          height: Number(profile.height) || 175,
          weight: Number(profile.weight) || 70,
          activity: Number(profile.activity) || 1.2,
          goal: profile.goal || 'maintain',
          password: profile.password || '00000000',
          hasSetTarget: !!profile.has_set_target,
          targetCalories: Number(profile.target_calories) || 2000
        }));
        if (profile.target_calories) setSavedTarget(Number(profile.target_calories));
      }

      // 2. Fetch Messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });
      
      if (msgs) {
        setInboxMessages(msgs);
      } else {
        // Initial Welcome Message
        setInboxMessages([{
          id: 'welcome',
          title: '歡迎來到 PhotoCalorie！',
          content: '您的健康旅程正式啟動。在這裡，您可以透過拍照輕鬆記錄每一餐，系統會自動為您分析營養組成。若有任何問題，請隨時查看說明文檔！',
          created_at: new Date().toISOString()
        }]);
      }

      // 2. Fetch Logs (Traditional Chinese focus)
      const { data: dbLogs } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbLogs) {
        const formattedLogs: FoodLog[] = dbLogs.map(l => ({
          id: l.id,
          foodName: l.food_name, // Should be in Chinese
          calories: l.calories,
          protein: l.protein,
          carbs: l.carbs,
          fat: l.fats,
          timestamp: new Date(l.created_at).getTime(),
          imageUrl: l.image_url
        }));
        setLogs(formattedLogs);
      }
      // 3. Post-load check for meal reminders
      generateMealReminders(dbLogs || []);

      // 4. Admin Check
      if (userId && authEmail === 'a0903383712@gmail.com') {
        setIsAdmin(true);
        fetchAdminStats();
      }
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      // Total Users
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Total Image Logs (Photo Usages)
      const { count: photoCount } = await supabase.from('logs').select('*', { count: 'exact', head: true }).not('image_url', 'is', null).neq('image_url', '');

      // Recent Growth (last 7 days - simple mock or actual query logic)
      const { data: recentUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20);

      setAdminStats({
        totalUsers: userCount || 0,
        totalPhotoUsage: photoCount || 0,
        recentGrowth: recentUsers || []
      });
    } catch (err) {
      console.error('Admin stats error:', err);
    }
  };

  const fetchUserDetails = async (user: any) => {
    try {
      setSelectedAdminUser(user);
      const { count } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('image_url', 'is', null)
        .neq('image_url', '');
      
      setSelectedUserStats({
        photoUsage: count || 0
      });
    } catch (err) {
      console.error('Fetch user detail error:', err);
    }
  };

  const sendAdminMessage = async () => {
    if (!selectedAdminUser || !adminMsgFormData.title || !adminMsgFormData.content) return;
    
    setIsAdminSending(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        user_id: selectedAdminUser.id,
        title: adminMsgFormData.title,
        content: adminMsgFormData.content,
        is_read: false
      }]);

      if (error) throw error;
      alert('🚀 訊息已成功派送至該學員收件夾！');
      setAdminMsgFormData({ title: '', content: '' });
    } catch (err) {
      alert('發送失敗，請檢查網路設定');
    } finally {
      setIsAdminSending(false);
    }
  };

  const sendGlobalBroadcast = async () => {
    if (!adminMsgFormData.title || !adminMsgFormData.content) return;
    
    setIsBroadcastingGlobal(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        user_id: null, // Global
        title: adminMsgFormData.title,
        content: adminMsgFormData.content,
        is_read: false
      }]);

      if (error) throw error;
      alert('🌎 全體廣播已成功派送至所有學員！');
      setAdminMsgFormData({ title: '', content: '' });
    } catch (err) {
      alert('廣播失敗，請檢查網路設定');
    } finally {
      setIsBroadcastingGlobal(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('PhotoCalorie ✨', {
        body: '您的健康提醒功能已成功開啟！我們會定時關心您的飲食紀錄。',
        icon: 'https://cdn-icons-png.flaticon.com/512/1037/1037762.png'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setIsCelebrationActive(true);
        testNotification();
        setTimeout(() => {
          setIsCelebrationActive(false);
          setIsNotificationModalOpen(false);
        }, 3000);
      } else {
        setIsNotificationModalOpen(false);
      }
    } else {
      alert('您的設備似乎不支援網頁通知，建議將此網頁「加入主畫面」後再試。');
      setIsNotificationModalOpen(false);
    }
  };

  const markMessagesAsRead = async () => {
    // 1. Update Local State
    setInboxMessages(prev => prev.map(m => ({ ...m, is_read: true })));

    // 2. Update Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const generateMealReminders = (currentLogs: any[]) => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const currentTimeVal = hour * 100 + min;

    const todayStr = now.toDateString();
    const todayLogs = currentLogs.filter(l => new Date(l.created_at || l.timestamp).toDateString() === todayStr);

    const reminders: any[] = [];
    
    // Breakfast (9:00+)
    if (currentTimeVal >= 900 && todayLogs.length === 0) {
      reminders.push({
        id: 'remind-bf',
        title: '☀️ 早餐紀錄提醒',
        content: '早安！吃過早餐了嗎？好的開始是成功的一半，快拍張照紀錄一下吧！',
        created_at: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
        is_read: false
      });
    }

    // Lunch (12:30+)
    if (currentTimeVal >= 1230 && todayLogs.length < 2) {
      reminders.push({
        id: 'remind-lh',
        title: '🍽️ 午餐補給時間',
        content: '中午休息時間到囉！別忘了為您的午餐留下紀錄。',
        created_at: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
        is_read: false
      });
    }

    // Dinner (18:00+)
    if (currentTimeVal >= 1800 && todayLogs.length < 3) {
      reminders.push({
        id: 'remind-dn',
        title: '🌙 晚餐結算提醒',
        content: '辛苦一整天了，優質的晚餐能幫您修復身體，記得紀錄喔！',
        created_at: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
        is_read: false
      });
    }

    if (reminders.length > 0) {
      setInboxMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = reminders.filter(r => !existingIds.has(r.id));
        
        // Trigger System Notification for new items - TEMPORARILY DISABLED FOR STABILITY
        /*
        uniqueNew.forEach(rem => {
          if (Notification.permission === 'granted') {
            new Notification(rem.title, {
              body: rem.content,
              icon: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              tag: rem.id // Prevent spamming same reminder
            });
          }
        });
        */

        return [...uniqueNew, ...prev];
      });
    }
  };

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
  }, [isLoggedIn]);

  /* Temporarily disabled local sync for stability
  useEffect(() => {
    localStorage.setItem('photocalorie_logs_v2', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('photocalorie_profile', JSON.stringify(userProfile));
  }, [userProfile]);
  */

  useEffect(() => {
    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    
    // We only show prompt if running on iOS Safari normally, skipping already installed ones.
    if (isIosDevice && isSafari && !isStandalone) {
      const hasDismissed = sessionStorage.getItem('dismissedInstallPrompt');
      if (!hasDismissed) {
        // Temporarily disabled auto-prompt to fix blackout issues on mobile browsers
        // const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
        // return () => clearTimeout(timer);
      }
    }
  }, []);

  // Calculations
  const calculateBMR = () => {
    const gender = userProfile.gender || 'male';
    const weight = Number(userProfile.weight) || 70;
    const height = Number(userProfile.height) || 175;
    const age = Number(userProfile.age) || 25;
    
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const bmr = calculateBMR();
  const tdee = Math.round(bmr * (Number(userProfile.activity) || 1.2));
  
  const getRecommended = () => {
    if (userProfile.goal === 'cut') return tdee - 300;
    if (userProfile.goal === 'bulk') return tdee + 300;
    return tdee;
  };
  const finalTarget = getRecommended();

  // Macro Calculation (P:30%, C:40%, F:30%)
  const macroGoals = {
    protein: Math.round((finalTarget * 0.3) / 4),
    carbs: Math.round((finalTarget * 0.4) / 4),
    fat: Math.round((finalTarget * 0.3) / 9)
  };

  const totalCaloriesForDate = (logs || [])
    .filter(log => log && log.timestamp && new Date(log.timestamp).toDateString() === selectedDate.toDateString())
    .reduce((acc, log) => acc + (log.calories || 0), 0);

  const totalMacrosForDate = (logs || [])
    .filter(log => log && log.timestamp && new Date(log.timestamp).toDateString() === selectedDate.toDateString())
    .reduce((acc, log) => ({
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0)
    }), { protein: 0, carbs: 0, fat: 0 });

  const [aiMessage, setAiMessage] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    const diff = savedTarget - totalCaloriesForDate;
    const messagesUnder = [
      { title: "距離達標還有一大截呢！", subtitle: "今天是不是特別忙呀？記得要多吃點喔！" },
      { title: "太瘦了不行喔！", subtitle: "離目標還很遠，再去吃個健康大餐吧！" },
      { title: "熱量額度還有剩喔！", subtitle: "別餓肚子了，這可是多吃無罪的好機會！" },
      { title: "肚子還空空的吧？", subtitle: "革命尚未成功，還須努力（吃）！" },
      { title: "能量補充不足預警！", subtitle: "革命的本錢是身體，多攝取點蛋白質吧！" }
    ];

    const messagesPerfect = [
      { title: "完美達成目標！", subtitle: "今天的飲食控制非常優秀，繼續保持！" },
      { title: "精準控卡大師！", subtitle: "熱量剛剛好，明天的你也一樣棒！" },
      { title: "今天的你無懈可擊！", subtitle: "目標達成！太神拉，自律的你最帥氣！" },
      { title: "100分的一天！", subtitle: "這就是自律的模樣，給自己掌聲鼓勵！" },
      { title: "這就是我們要的完美！", subtitle: "均衡攝取，完美達標，可以安心休息囉！" }
    ];

    const messagesOver = [
      { title: "熱量爆表啦！", subtitle: "今天是不是特別餓呀？偶爾放縱不錯啦！" },
      { title: "超標一點點沒關係的！", subtitle: "吃飽了才有力氣減肥，對吧？" },
      { title: "看來今天是放縱日？", subtitle: "沒關係的，卡路里都化成了開心的樣子！" },
      { title: "熱量超出額度囉！", subtitle: "沒事沒事，明天多動兩下補回來就好！" },
      { title: "哎呀，不小心吃太多啦！", subtitle: "一定是食物太誘人了，絕對不是你的錯！" }
    ];

    let pool = messagesPerfect;
    
    // Override with Meal-specific reminders based on time
    const now = new Date();
    const hour = now.getHours();
    if (totalCaloriesForDate === 0) {
      if (hour >= 8 && hour < 11) {
        setAiMessage({ title: "早安！☀️", subtitle: "還沒紀錄早餐嗎？快拍張照片，讓我們幫您分析！" });
        return;
      }
      if (hour >= 12 && hour < 14) {
        setAiMessage({ title: "午餐時間！🍽️", subtitle: "紀錄午餐是維持代謝的關鍵，現在就開始吧！" });
        return;
      }
      if (hour >= 18 && hour < 21) {
        setAiMessage({ title: "晚餐紀錄！🌙", subtitle: "別忘了紀錄今天的最後一餐喔，這對睡眠很有幫助。" });
        return;
      }
    }

    if (diff > 250) pool = messagesUnder;
    else if (diff < -250) pool = messagesOver;
    else pool = messagesPerfect;

    if (pool && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      const selected = pool[index];
      if (selected) setAiMessage(selected);
    } else {
      setAiMessage({ title: "歡迎回來！", subtitle: "準備好紀錄下一餐了嗎？" });
    }
  }, [totalCaloriesForDate, savedTarget, selectedDate]);

  // AI Logic
  const startAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: '請問這張照片中的食物是什麼？請嚴格使用「繁體中文」回傳一個純 JSON 物件（不要包含 markdown 標籤），包含以下欄位： "foodName" (食物名稱，繁體中文), "calories" (總熱量), "protein" (蛋白質克數), "carbs" (碳水化合物克數), "fat" (脂肪克數), "ingredients" (組成食材陣列，每個物件包含 "name"(繁體中文名稱), "weight"(克數), "calories", "protein", "carbs", "fat"), 以及 "evaluation" (一段專業且精簡的繁體中文營養師講評)。' },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonContent);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      alert('系統辨識忙碌中，請稍後再試');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base = reader.result as string;
        setSelectedImage(base);
        startAnalysis(base);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base = reader.result as string;
        setIsAuthLoading(true);
        const cloudUrl = await uploadImage(base, 'avatars');
        setUserProfile(prev => ({ ...prev, avatar: cloudUrl }));
        setIsAuthLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (base64: string, path: string) => {
    try {
      const base64Data = base64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const fullPath = `${path}/${fileName}`;

      const { error } = await supabase.storage.from('images').upload(fullPath, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fullPath);
      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return base64;
    }
  };

  const confirmLog = async () => {
    if (analysisResult && selectedImage) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('請先登入');

      setIsAuthLoading(true);
      try {
        const cloudImageUrl = await uploadImage(selectedImage, 'food');
        const logData = {
          user_id: user.id,
          food_name: analysisResult.foodName,
          calories: analysisResult.calories,
          protein: analysisResult.protein,
          carbs: analysisResult.carbs,
          fats: analysisResult.fat,
          image_url: cloudImageUrl
        };

        const { data, error } = await supabase.from('logs').insert([logData]).select();
        if (error) throw error;

        const newLog: FoodLog = {
          id: data[0].id,
          foodName: logData.food_name,
          calories: logData.calories,
          protein: logData.protein,
          carbs: logData.carbs,
          fat: logData.fats,
          timestamp: Date.now(),
          imageUrl: cloudImageUrl
        };

        setLogs([newLog, ...logs]);
        setIsCapturing(false);
        setSelectedImage(null);
        setAnalysisResult(null);
        alert('🌈 飲食紀錄已成功雲端同步！');
      } catch (err) {
        alert('儲存失敗，請檢查網路連線');
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  const confirmManualEntry = async () => {
    if (!manualFormData.name || !manualFormData.calories) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('請先登入');

    setIsAuthLoading(true);
    try {
      let finalImageUrl = '';
      if (manualFormData.image) {
        finalImageUrl = await uploadImage(manualFormData.image, 'food');
      }

      const logData = {
        user_id: user.id,
        food_name: manualFormData.name,
        calories: parseInt(manualFormData.calories),
        protein: parseInt(manualFormData.protein || '0'),
        carbs: parseInt(manualFormData.carbs || '0'),
        fats: parseInt(manualFormData.fat || '0'),
        image_url: finalImageUrl
      };

      const { data, error } = await supabase.from('logs').insert([logData]).select();
      if (error) throw error;

      const newLog: FoodLog = {
        id: data[0].id,
        foodName: logData.food_name,
        calories: logData.calories,
        protein: logData.protein,
        carbs: logData.carbs,
        fat: logData.fats,
        timestamp: selectedDate.getTime(),
        imageUrl: finalImageUrl
      };

      setLogs([newLog, ...logs]);
      setIsManualModalOpen(false);
      setManualFormData({ name: '', calories: '', protein: '', carbs: '', fat: '', notes: '', image: null });
      alert('📝 手動紀錄已成功同步！');
    } catch (err) {
      alert('儲存失敗，請檢查網路');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm('確定要刪除這筆紀錄嗎？此動作不可撤銷。')) return;
    
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.from('logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(logs.filter(l => l.id !== id));
      alert('🗑️ 紀錄已成功刪除');
    } catch (err) {
      alert('刪除失敗，請檢查網路');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const updateLog = async () => {
    if (!editingLog) return;
    
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.from('logs').update({
        food_name: editingLog.foodName,
        calories: Number(editingLog.calories),
        protein: Number(editingLog.protein),
        carbs: Number(editingLog.carbs),
        fats: Number(editingLog.fat),
        notes: editingLog.notes
      }).eq('id', editingLog.id);

      if (error) throw error;
      
      setLogs(logs.map(l => l.id === editingLog.id ? editingLog : l));
      setEditingLog(null);
      alert('✅ 紀錄已成功更新');
    } catch (err) {
      alert('更新失敗，請檢查網路');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-8 relative">
      {/* Onboarding Overlay for Target Setting */}
      {!userProfile.hasSetTarget && (
        <div className="absolute inset-x-[-20px] inset-y-[-20px] z-40 flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="glass-card p-10 bg-gradient-to-b from-zinc-900 to-black border-primary/30 relative z-50 text-center space-y-8 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
           >
             <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <Target size={48} className="text-primary animate-pulse" />
             </div>
             <div className="space-y-3">
               <h3 className="text-3xl font-black text-white">設定您的首個目標</h3>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 在開始紀錄飲食之前，我們需要根據您的身體數據計算每日建議攝取。這只需 30 秒。
               </p>
             </div>
             <button 
               onClick={() => setActiveTab('target')}
               className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4 rounded-2xl transition-all shadow-2xl active:scale-95 text-lg uppercase flex items-center justify-center gap-3"
             >
                前往設置目標 <ArrowRight size={20} />
             </button>
           </motion.div>
        </div>
      )}

      {/* Header Profile */}
      <div className="flex justify-between items-center bg-black/40 p-1 rounded-full pr-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-primary p-0.5 overflow-hidden">
            <img src={userProfile.avatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
          </div>
          <div>
            <h2 className="text-zinc-100 font-black text-xl leading-none">{userProfile.name.split(' ')[0]}</h2>
            <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest italic opacity-70">掌控今日的飲食計畫</p>
          </div>
        </div>
        <div className="relative cursor-pointer hover:scale-110 transition-transform p-2 active:bg-white/10 rounded-full" onClick={() => { setIsInboxOpen(true); markMessagesAsRead(); }}>
          <Mail size={24} className="text-zinc-400" />
          {inboxMessages.some(m => !m.is_read) && (
            <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-black" />
          )}
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="flex justify-between items-center py-2 overflow-x-auto no-scrollbar">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const d = new Date(selectedDate);
          d.setDate(selectedDate.getDate() + offset);
          const isSelected = offset === 0;
          
          const todayCheck = new Date();
          todayCheck.setHours(23, 59, 59, 999);
          const isFuture = d.getTime() > todayCheck.getTime();

          return (
            <div 
              key={offset} 
              onClick={() => !isFuture && setSelectedDate(d)}
              className={`flex flex-col items-center gap-2 p-2 px-3 rounded-2xl transition-all ${isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer'} ${isSelected ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/20' : (isFuture ? 'text-zinc-600' : 'text-zinc-500 hover:text-zinc-300')}`}
            >
              <span className={`text-[10px] uppercase ${isSelected ? 'font-black' : 'font-bold'}`}>{d.toLocaleString('en-US', { month: 'short' })}</span>
              <span className={`text-lg ${isSelected ? 'font-black' : 'font-bold'}`}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Main Stats Card */}
      <div className="glass-card p-8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="grid grid-cols-3 items-end gap-2 relative z-10">
          {/* Left: Consumed */}
          <div className="flex flex-col items-center pb-2">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">已攝取 Consumed</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-zinc-100">{totalCaloriesForDate}</span>
              <span className="text-[10px] text-zinc-500/50 font-black uppercase italic tracking-tighter">kcal</span>
            </div>
          </div>
          
          {/* Middle: Remaining with Ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <CircularProgress consumed={totalCaloriesForDate} target={savedTarget} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={`text-4xl font-black ${
                    (() => {
                       const diff = Math.abs(savedTarget - totalCaloriesForDate);
                       if (diff <= 100) return 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]';
                       if (diff <= 250) return 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]';
                       return 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.95)] animate-pulse transition-all duration-300';
                    })()
                 }`}>
                    {Math.abs(savedTarget - totalCaloriesForDate)}
                 </span>
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest -mt-1 opacity-60 italic">
                    {savedTarget - totalCaloriesForDate >= 0 ? "Left / 剩餘" : "Over / 超出"}
                 </span>
              </div>
            </div>
            <span className="text-zinc-200 font-black text-sm uppercase tracking-[0.2em] mt-5 italic">剩餘熱量</span>
          </div>

          {/* Right: Goal */}
          <div className="flex flex-col items-center pb-2">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">目標 Goal</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-zinc-100">{savedTarget}</span>
              <span className="text-[10px] text-zinc-500/50 font-black uppercase italic tracking-tighter">kcal</span>
            </div>
          </div>
        </div>

        {/* Micro Stats */}
        <div className="grid grid-cols-3 gap-6 mt-10">
          {[
            { l: 'Protein', n: '蛋白質', v: `${Math.round(totalMacrosForDate.protein)}/${macroGoals.protein}g`, c: '#f59e0b', p: (totalMacrosForDate.protein / macroGoals.protein) * 100 },
            { l: 'Carbs', n: '碳水', v: `${Math.round(totalMacrosForDate.carbs)}/${macroGoals.carbs}g`, c: '#10b981', p: (totalMacrosForDate.carbs / macroGoals.carbs) * 100 },
            { l: 'Fats', n: '脂肪', v: `${Math.round(totalMacrosForDate.fat)}/${macroGoals.fat}g`, c: '#f43f5e', p: (totalMacrosForDate.fat / macroGoals.fat) * 100 }
          ].map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-500 uppercase italic leading-none">{m.l}</span>
                  <span className="text-[10px] font-bold text-zinc-300">{m.n}</span>
                </div>
                <span className="text-[10px] font-black text-zinc-300">{m.v}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, m.p)}%` }}
                  className="h-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                  style={{ backgroundColor: m.c }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Assistant Alert */}
      <div className="glass-card bg-zinc-900/40 p-5 flex items-center gap-4 border-white/5 active:scale-95 transition-transform cursor-pointer shadow-xl">
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
          <span className="text-primary font-black text-2xl tracking-widest italic pr-1 shadow-primary/20 drop-shadow-md">OZ</span>
        </div>
        <div className="flex-1">
          <AnimatePresence mode="wait">
             <motion.div
               key={aiMessage.title}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               transition={{ duration: 0.3 }}
             >
                <h4 className="text-zinc-200 font-black text-sm">{aiMessage.title}</h4>
                <p className="text-zinc-500 text-[11px] mt-0.5 font-bold leading-snug">{aiMessage.subtitle}</p>
             </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Food Log List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-black tracking-tight">飲食紀錄 <span className="text-primary italic">Daily</span> Log</h3>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsManualModalOpen(true); }}
            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-lg active:scale-90 border border-primary/20 relative z-20"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-4">
          {logs.filter(log => new Date(log.timestamp).toDateString() === selectedDate.toDateString()).length === 0 ? (
             <div className="py-12 text-center text-zinc-500 font-bold border-2 border-dashed border-zinc-800 rounded-[32px]">
                尚無餐飲記錄
             </div>
          ) : (
            logs
              .filter(log => new Date(log.timestamp).toDateString() === selectedDate.toDateString())
              .map((log) => (
              <div key={log.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-zinc-800/40 transition-all border-white/5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                  {log.imageUrl ? (
                    <img src={log.imageUrl} className="w-full h-full object-cover" alt={log.foodName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Utensils size={24} className="text-zinc-600"/></div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-zinc-100 font-black text-lg truncate">{log.foodName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-primary font-black text-sm tracking-wide">{log.calories} cl</p>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">| P:{log.protein} C:{log.carbs} F:{log.fat}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={() => setEditingLog(log)}
                     className="p-3 text-zinc-600 hover:text-primary active:scale-90 transition-all"
                   >
                     <PenLine size={18} />
                   </button>
                   <button 
                     onClick={() => deleteLog(log.id)}
                     className="p-3 text-zinc-600 hover:text-rose-500 active:scale-90 transition-all"
                   >
                     <X size={18} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const handleStartCalc = () => {
    setIsCalculatingTarget(true);
    setTimeout(() => {
      setIsCalculatingTarget(false);
      setShowTargetResults(true);
    }, 2000);
  };

  const renderTarget = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full flex flex-col">
      {!showTargetResults && !isCalculatingTarget && (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                 <Target className="text-primary" size={28} />
              </div>
              目標計算機
            </h2>
            <p className="text-zinc-500 font-bold">精準計算您的日常熱量消耗 (TDEE)</p>
          </div>

          <div className="glass-card p-6 bg-zinc-900/40 border-white/5 space-y-6">
            {/* Gender Selection */}
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map(g => (
                <button
                  key={g}
                  onClick={() => setUserProfile({...userProfile, gender: g})}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all ${userProfile.gender === g ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                >
                  {g === 'male' ? '男生 Male' : '女生 Female'}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 gap-6">
              <InputGroup label="年齡 Age" value={userProfile.age} unit="歲" onChange={(v) => setUserProfile({...userProfile, age: Number(v)})} />
              <InputGroup label="身高 Height" value={userProfile.height} unit="CM" onChange={(v) => setUserProfile({...userProfile, height: Number(v)})} />
              <InputGroup label="體重 Weight" value={userProfile.weight} unit="KG" onChange={(v) => setUserProfile({...userProfile, weight: Number(v)})} />
            </div>

            {/* Activity Level */}
            <div className="space-y-4">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest italic">活動程度 Activity Level</label>
              <div className="flex flex-col gap-2">
                {[
                  { l: '久坐 (辦公室工作)', v: 1.2 },
                  { l: '輕量 (每週運動 1-3 次)', v: 1.375 },
                  { l: '中度 (每週運動 3-5 次)', v: 1.55 },
                  { l: '高度 (每週運動 6-7 次)', v: 1.725 },
                  { l: '極端 (高強度體力活/運動員)', v: 1.9 }
                ].map(act => (
                  <button
                    key={act.v}
                    onClick={() => setUserProfile({...userProfile, activity: act.v})}
                    className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border ${userProfile.activity === act.v ? 'bg-primary/20 border-primary/50 text-white' : 'bg-black/20 border-zinc-900 text-zinc-500 hover:border-zinc-800'}`}
                  >
                    {act.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selection */}
            <div className="space-y-4">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest italic">目標期望 Goal</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cut', label: '減脂', sub: '-300' },
                  { id: 'maintain', label: '維持', sub: 'TDEE' },
                  { id: 'bulk', label: '增肌', sub: '+300' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setUserProfile({...userProfile, goal: g.id as any})}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${userProfile.goal === g.id ? 'bg-primary border-primary text-black' : 'bg-black/20 border-zinc-800 text-zinc-500'}`}
                  >
                    <span className="font-black text-sm">{g.label}</span>
                    <span className="text-[10px] font-bold opacity-60 tracking-wider truncate">{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartCalc}
              className="w-full py-6 bg-primary text-black rounded-[32px] font-black text-xl shadow-[0_12px_40px_rgba(245,158,11,0.3)] mt-4 active:scale-95 transition-transform flex items-center justify-center gap-3 overflow-hidden"
            >
               <span>開始計算目標熱量</span>
            </motion.button>
          </div>
        </>
      )}

      {/* High-Tech Loading State */}
      <AnimatePresence>
        {isCalculatingTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20 gap-8"
          >
            <div className="relative w-48 h-48 flex items-center justify-center">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                 className="absolute inset-0 border-[6px] border-primary/20 rounded-full border-t-primary"
               />
               <motion.div 
                 animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                 transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                 className="absolute inset-6 border-[2px] border-primary/40 rounded-full border-b-primary border-dashed"
               />
               <motion.div 
                 animate={{ opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
                 className="w-20 h-20 bg-primary/20 rounded-full blur-xl"
               />
               <Target size={40} className="text-primary relative z-10" />
            </div>
            
            <div className="text-center space-y-3">
              <motion.p 
                animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-primary font-black text-xl tracking-[0.2em] uppercase"
              >
                核心數據解析中
              </motion.p>
              <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest italic animate-pulse">Analyzing Metabolism...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      {showTargetResults && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="space-y-6 pb-20"
        >
          {/* Main Results Prescription Card */}
          <div className="glass-card p-10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-primary/20 relative overflow-hidden ring-1 ring-white/5">
            {/* Reset Button (Top Right Top) */}
            <button
              onClick={() => setShowTargetResults(false)}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95 group"
            >
              <RefreshCcw size={12} className="text-zinc-500 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-200 uppercase tracking-widest transition-all">重新調整</span>
            </button>

            {/* Background Decorative Rings */}
            <div className="absolute -top-10 -right-10 opacity-5">
               <Target size={240} />
            </div>

            <div className="space-y-4 relative z-10 text-center">
              <p className="text-zinc-500 font-black uppercase text-xs tracking-widest italic">您的每日建議總攝取</p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-8xl font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-baseline justify-center gap-2"
              >
                {finalTarget}
                <span className="text-3xl italic font-black uppercase tracking-tighter opacity-60">kcal</span>
              </motion.h2>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  setIsAuthLoading(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from('profiles').update({
                        target_calories: finalTarget,
                        has_set_target: true
                      }).eq('id', user.id);
                      
                      setUserProfile(prev => ({ ...prev, hasSetTarget: true, targetCalories: finalTarget }));
                      setSavedTarget(finalTarget);
                      alert(`✅ 專屬目標 ${finalTarget} kcal 已成功鎖定！`);
                      setActiveTab('home');
                    }
                  } catch (err) {
                    setSavedTarget(finalTarget);
                    setActiveTab('home');
                  } finally {
                    setIsAuthLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-black rounded-full font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(245,158,11,0.3)] mt-6"
              >
                {isAuthLoading ? '同步中...' : <><CheckCircle2 size={18} /> 確認並鎖定目標</>}
              </motion.button>
            </div>
            
            <div className="h-px bg-zinc-800/50 w-full my-8" />
            
            {/* Metabolism Stats */}
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black text-zinc-500 uppercase italic mb-1">TDEE 每日總消耗</p>
                 <p className="text-2xl font-black text-zinc-100">{tdee} <span className="text-xs text-zinc-500">kcal</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-black text-zinc-500 uppercase italic mb-1">BMR 基礎代謝</p>
                 <p className="text-2xl font-black text-zinc-100">{Math.round(bmr)} <span className="text-xs text-zinc-500">kcal</span></p>
              </div>
            </div>

            {/* Macro Distribution Chart */}
            <div className="mt-10 space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">三大營養素比例分配</p>
                <p className="text-[10px] font-bold text-primary italic">均衡配比 30 : 40 : 30</p>
              </div>
              
              <div className="h-6 w-full bg-zinc-800/50 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: '30%' }} className="h-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-black">P</div>
                <div style={{ width: '40%' }} className="h-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-black">C</div>
                <div style={{ width: '30%' }} className="h-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-black">F</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                   <p className="text-[10px] font-black text-amber-500 uppercase">蛋白質</p>
                   <p className="text-lg font-black text-zinc-100">{macroGoals.protein}g</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-emerald-500 uppercase">碳水</p>
                   <p className="text-lg font-black text-zinc-100">{macroGoals.carbs}g</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-rose-500 uppercase">脂肪</p>
                   <p className="text-lg font-black text-zinc-100">{macroGoals.fat}g</p>
                </div>
              </div>
            </div>
            
            {/* Medical Interpretation */}
            <div className="mt-12 pt-8 border-t border-zinc-800/50 space-y-4">
               <div className="flex items-center gap-2 text-primary">
                  <Activity size={16} />
                  <h4 className="text-sm font-black uppercase tracking-wider">醫學與營養學解析 Report Analysis</h4>
               </div>
               
               <div className="bg-black/40 p-5 rounded-3xl space-y-4 text-[13px] leading-relaxed text-zinc-400 font-medium border border-white/5">
                  <p>
                    <strong className="text-zinc-200">能量平衡 (Energy Balance)：</strong> 
                    您的 BMR ({Math.round(bmr)} kcal) 代表維持呼吸、心跳等基礎生命現象所需的最小能量。TDEE ({tdee} kcal) 則考量了您的活動係數。
                    {userProfile.goal === 'cut' ? '當前設定為熱量負平衡，旨在啟動脂肪氧化而不影響基礎代謝穩定。' : userProfile.goal === 'bulk' ? '當前設定為熱量正平衡，提供肌肉蛋白質合成所需的額外能量環境。' : '當前設定為等熱量攝取，旨在維持體重穩定與細胞修復。'}
                  </p>
                  <p>
                    <strong className="text-zinc-200">宏量比例 (Macro Ratio)：</strong> 
                    採用的 30/40/30 比例設計旨在優化「胰島素敏感度」。高比例蛋白質 ({macroGoals.protein}g) 能提供充足的胺基酸池防止肌肉流失；適度碳水供應大腦與訓練能量；脂肪則確保賀爾蒙調控軸正常運作。
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-primary/60 italic text-[11px] font-bold">
                    <CheckCircle2 size={12} />
                    建議根據實際訓練強度微調整體攝取。
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderScanOverlay = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black z-[100] ${analysisResult ? 'overflow-y-auto no-scrollbar scroll-smooth' : 'flex flex-col overflow-hidden'}`}
    >
      {/* 1. Header with Safe Area Support */}
      <div 
        className="bg-black/95 border-b border-white/5 px-6 pb-6 shrink-0 z-50 flex flex-col transition-all duration-300"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 12px)' }}
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { 
              setIsCapturing(false); 
              setSelectedImage(null); 
              setAnalysisResult(null); 
              if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                setVideoStream(null);
              }
            }} 
            className="w-12 h-12 flex items-center justify-center text-zinc-400 bg-white/5 rounded-full active:scale-90 transition-transform"
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-primary font-black tracking-[0.3em] uppercase text-xs italic">Live Scan</h1>
            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 animate-pulse" />
          </div>
          <div className="w-12 h-12" />
        </div>
      </div>

      <div className={`relative flex flex-col flex-1 overflow-hidden touch-none ${analysisResult ? 'overflow-y-auto' : ''}`}>
        {/* viewfinder content */}
        <div className={`relative flex items-center justify-center shrink-0 ${analysisResult ? 'w-full bg-black py-10' : 'flex-1 bg-zinc-950/20 px-4'}`}>
        {selectedImage ? (
          <div className="relative w-[92%] aspect-[3/4] max-h-[60vh] rounded-[48px] overflow-hidden border-[6px] border-primary shadow-[0_0_50px_rgba(245,158,11,0.5)] z-10">
            <img 
              src={selectedImage} 
              className="w-full h-full object-cover" 
              alt="Captured" 
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="relative w-[92%] aspect-[3/4] rounded-[56px] border-2 border-white/10 overflow-hidden shadow-[0_0_0_2000px_rgba(0,0,0,0.85)] bg-black transition-all">
                {/* LIVE CAMERA FEED */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                {/* Status Indicator */}
                {!videoStream && !selectedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-primary font-black text-[10px] uppercase tracking-widest animate-pulse">Accessing Camera...</span>
                  </div>
                )}

                {/* Extra Large Luxury Corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-[6px] border-l-[6px] border-primary rounded-tl-[56px] m-[-2px] z-20" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-[6px] border-r-[6px] border-primary rounded-tr-[56px] m-[-2px] z-20" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[6px] border-l-[6px] border-primary rounded-bl-[56px] m-[-2px] z-20" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[6px] border-r-[6px] border-primary rounded-br-[56px] m-[-2px] z-20" />

                {/* Constant Scan Line Animation */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_40px_rgba(245,158,11,1)] z-30"
                />
             </div>
          </div>
        )}
        </div>


        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-8 z-[60]">
             <div className="relative flex items-center justify-center">
                 {/* Outer rotating dashed ring */}
                 <div className="absolute w-32 h-32 border-[3px] border-dashed border-primary/40 rounded-full animate-[spin_10s_linear_infinite]" />
                 {/* Inner fast spinner */}
                 <div className="w-24 h-24 border-4 border-primary border-t-transparent border-l-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
                 {/* Center pulsing icon */}
                 <Zap className="absolute text-white animate-pulse w-10 h-10 drop-shadow-[0_0_15px_rgba(255,255,255,1)]" />
             </div>
             
             <div className="flex flex-col items-center gap-3 text-center">
                 <p className="text-white font-black tracking-[0.3em] uppercase text-xl shadow-black drop-shadow-md">AI Vision Analysis</p>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                   <p className="text-primary font-bold tracking-widest text-[11px] uppercase opacity-90">Extracting Macros & Ingredients...</p>
                 </div>
             </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`bg-black/95 backdrop-blur-3xl border-t border-white/5 transition-all duration-500 ease-in-out relative z-20 ${analysisResult ? 'w-full p-8 pb-32' : 'w-full p-10 space-y-8 mt-auto'}`}>
        {!analysisResult ? (
          <div className="flex flex-col items-center gap-10">
            {/* SHUTTER BUTTON - NATIVE LABEL FIX */}
            {!selectedImage && !isAnalyzing && (
              <div className="relative">
                <label className="block w-24 h-24 rounded-full border-[6px] border-zinc-700/50 p-1.5 active:scale-90 transition-transform cursor-pointer shadow-2xl">
                  <div className="w-full h-full rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    capture={scanMode === 'food' ? "environment" : undefined}
                    onChange={handleImageSelect}
                  />
                </label>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-primary font-black text-[10px] uppercase tracking-widest italic whitespace-nowrap">Tap to Scan</span>
              </div>
            )}

            {/* Mode Selector */}
            {!selectedImage && (
              <div className="bg-zinc-900/80 p-1.5 rounded-full flex gap-1 border border-white/5 shadow-2xl backdrop-blur-md">
                {[
                  { id: 'food', label: '食物掃描' },
                  { id: 'photo', label: '照片選擇' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setScanMode(mode.id as any);
                      if (mode.id === 'photo') {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`px-8 py-3 rounded-full text-xs font-black transition-all duration-300 ${scanMode === mode.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full space-y-6 pb-12">
            {/* Title & Calories */}
            <div className="flex justify-between items-center border-b border-white/5 pb-8">
              <div className="flex flex-col gap-3 relative w-full pr-4">
                <input 
                  type="text"
                  value={analysisResult.foodName}
                  onChange={(e) => setAnalysisResult({...analysisResult, foodName: e.target.value})}
                  className="text-4xl font-black text-white tracking-tight bg-transparent border-b border-dashed border-white/30 hover:border-white/60 focus:border-primary focus:outline-none transition-colors w-full pb-1 placeholder:text-zinc-600"
                  placeholder="Enter food name"
                />
                <div className="flex items-center">
                  <span className="text-zinc-200 font-bold text-sm bg-white/10 px-4 py-1.5 rounded-full">{analysisResult.calories} cl</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-auto mb-1 shrink-0">
                <Clock size={12} />
                Just Now
              </div>
            </div>
            
            {/* Macronutrients Grid */}
            <div className="grid grid-cols-4 gap-2 text-center border-b border-white/5 pb-8 relative">
              <div className="flex flex-col">
                <p className="text-3xl font-black text-primary">{analysisResult.calories}</p>
                <p className="text-[9px] text-primary font-black uppercase tracking-[0.1em] mt-2">Calories</p>
              </div>
              <div className="flex flex-col">
                <p className="text-3xl font-black text-white">{analysisResult.carbs}g</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-2">Carbs</p>
              </div>
              <div className="flex flex-col">
                <p className="text-3xl font-black text-white">{analysisResult.protein}g</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-2">Proteins</p>
              </div>
              <div className="flex flex-col">
                <p className="text-3xl font-black text-white">{analysisResult.fat}g</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-2">Fats</p>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="space-y-4 pt-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-6">詳細食材成分</p>
              {analysisResult.ingredients?.map((ing: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 pb-5 border-b border-white/5 last:border-0 last:pb-2">
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-200 font-black text-[17px]">{ing.name}</span>
                    <span className="text-zinc-400 text-xs font-black">{ing.weight}g</span>
                  </div>
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-300">{ing.calories} CL</span>
                    <span className="text-blue-500">{ing.carbs}G C</span>
                    <span className="text-green-500">{ing.protein}G P</span>
                    <span className="text-red-500">{ing.fat}G F</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Evaluation Comment */}
            {analysisResult.evaluation && (
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 mt-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 italic">Nutritionist's Note / 營養師評語</h4>
                <p className="text-sm text-zinc-300 leading-relaxed font-bold relative z-10">{analysisResult.evaluation}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-8 pt-4 border-t border-white/5">
              <button onClick={confirmLog} className="w-full py-5 bg-primary text-black rounded-3xl font-black text-lg shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-3">
                <CheckCircle2 size={24} strokeWidth={2.5} /> 登記在今日紀錄
              </button>
              <button 
                onClick={() => { setIsCapturing(false); setSelectedImage(null); setAnalysisResult(null); }} 
                className="w-full py-4 bg-zinc-800 border-[3px] border-white/50 text-white hover:bg-zinc-700 hover:border-white rounded-3xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <X size={24} strokeWidth={2.5} /> 不紀錄，返回主頁
              </button>
            </div>
          </div>
        )}
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />
        <input type="file" ref={cameraInputRef} hidden accept="image/*" capture="environment" onChange={handleImageSelect} />
      </div>
    </motion.div>
  );
  const renderManualAddModal = () => (
    <AnimatePresence>
      {isManualModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">手動記錄餐次</h2>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Image Input */}
              <div 
                className="aspect-video rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('manual-image')?.click()}
              >
                {manualFormData.image ? (
                  <img src={manualFormData.image} className="w-full h-full object-cover" alt="Upload" />
                ) : (
                  <>
                    <ImageIcon className="text-zinc-700 mb-2" size={32} />
                    <span className="text-sm font-bold text-zinc-600">匯入食物照片</span>
                  </>
                )}
                <input 
                  id="manual-image"
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setManualFormData({ ...manualFormData, image: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">食物名稱</label>
                <input 
                  type="text"
                  placeholder="例如：酪梨土司"
                  className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary"
                  value={manualFormData.name}
                  onChange={(e) => setManualFormData({ ...manualFormData, name: e.target.value })}
                />
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase text-primary">熱量 (kcal)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-primary"
                    value={manualFormData.calories}
                    onChange={(e) => setManualFormData({ ...manualFormData, calories: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase text-blue-400">蛋白質 (g)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-400/50"
                    value={manualFormData.protein}
                    onChange={(e) => setManualFormData({ ...manualFormData, protein: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase text-green-400">碳水 (g)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-green-400/50"
                    value={manualFormData.carbs}
                    onChange={(e) => setManualFormData({ ...manualFormData, carbs: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase text-red-400">脂肪 (g)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-red-400/50"
                    value={manualFormData.fat}
                    onChange={(e) => setManualFormData({ ...manualFormData, fat: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">註記 (Optional)</label>
                <textarea 
                  placeholder="例如：早餐、晚餐、花費、放縱餐..."
                  className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                  value={manualFormData.notes}
                  onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                />
              </div>

              <button 
                onClick={confirmManualEntry}
                disabled={isAuthLoading}
                className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
              >
                {isAuthLoading ? '同步中...' : '儲存飲食紀錄'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderActivity = () => {
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
    // Monthly Progress Calculations
    let loggedDays = 0;
    let greenDays = 0;
    let yellowDays = 0;
    let redDays = 0;

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i);
        const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === d.toDateString());
        if (dayLogs.length > 0) {
            loggedDays++;
            const dayCals = dayLogs.reduce((acc, log) => acc + log.calories, 0);
            const diff = Math.abs(savedTarget - dayCals);
            if (diff <= 100) greenDays++;
            else if (diff <= 250) yellowDays++;
            else redDays++;
        }
    }

    const logRatioPercent = (loggedDays / daysInMonth) * 100;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <History className="text-primary" size={28} />
                  </div>
                  紀錄與分析
                </h2>
                <p className="text-zinc-500 font-bold">歷史日曆與營養回顧</p>
              </div>
              <button 
                onClick={() => setShowHistoryGuide(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 shadow-xl rounded-xl border border-white/5 text-zinc-400 hover:text-primary transition-colors focus:scale-95 active:scale-90"
              >
                <Info size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">查看介紹</span>
              </button>
            </div>

            {/* Monthly Progress Bars */}
            <div className="glass-card p-6 bg-gradient-to-t from-zinc-900/80 to-zinc-900/40 border-white/5 space-y-7 rounded-[32px] relative overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
               
               {/* 1. Logged Days Bar */}
               <div className="space-y-3 relative z-10">
                 <div className="flex justify-between items-center mb-1">
                   <div className="flex flex-col">
                     <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">當月紀錄天數</span>
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Logged Days</span>
                   </div>
                   <div className="flex items-baseline gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5 shadow-inner">
                     <span className="text-xl font-black text-white">{loggedDays}</span>
                     <span className="text-[11px] font-bold text-zinc-500">/ {daysInMonth}</span>
                   </div>
                 </div>
                 <div className="h-3.5 w-full bg-black/60 rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${logRatioPercent}%` }} className="h-full bg-gradient-to-r from-orange-600 to-primary rounded-full drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                 </div>
               </div>

               {/* 2. Performance Segments */}
               <div className="space-y-3 relative z-10">
                 <div className="flex justify-between items-center mb-1">
                   <div className="flex flex-col">
                     <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">指標達成品質</span>
                     <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Quality Ratio</span>
                   </div>
                   {loggedDays > 0 ? (
                     <div className="flex gap-2">
                       <span className="text-[10px] font-black flex items-center justify-center min-w-[32px] h-6 bg-black/40 rounded border border-green-500/20 text-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.3)]">{greenDays}</span>
                       <span className="text-[10px] font-black flex items-center justify-center min-w-[32px] h-6 bg-black/40 rounded border border-yellow-400/20 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.3)]">{yellowDays}</span>
                       <span className="text-[10px] font-black flex items-center justify-center min-w-[32px] h-6 bg-black/40 rounded border border-red-500/20 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]">{redDays}</span>
                     </div>
                   ) : (
                     <span className="text-[10px] font-bold text-zinc-600 bg-black/40 px-3 py-1 rounded-full border border-white/5">尚無表現數據</span>
                   )}
                 </div>
                 <div className="h-3.5 w-full bg-black/60 rounded-full overflow-hidden flex p-[2px] border border-white/5 shadow-inner gap-0.5">
                   {loggedDays > 0 ? (
                     <>
                       {greenDays > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(greenDays / loggedDays) * 100}%` }} className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-l-full" />}
                       {yellowDays > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(yellowDays / loggedDays) * 100}%` }} className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" />}
                       {redDays > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(redDays / loggedDays) * 100}%` }} className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-r-full" />}
                     </>
                   ) : (
                     <div className="w-full h-full bg-transparent" />
                   )}
                 </div>
               </div>
            </div>
            
            {/* Calendar */}
            <div className="glass-card bg-zinc-900/40 p-5 rounded-3xl border-white/5 space-y-4">
               <div className="flex justify-between items-center px-2">
                 <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>
                    <ChevronLeft size={24}/>
                 </button>
                 <span className="font-black text-xl uppercase tracking-widest text-primary">{viewMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                 <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>
                    <ChevronRight size={24}/>
                 </button>
               </div>
               
               <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mt-4">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[10px] font-black text-zinc-600">{d}</div>)}
                 {days.map((d, i) => {
                     if (!d) return <div key={`empty-${i}`} />;
                     const isSelected = d.toDateString() === selectedDate.toDateString();
                     
                     const todayCheck = new Date();
                     todayCheck.setHours(23, 59, 59, 999);
                     const isFuture = d.getTime() > todayCheck.getTime();

                     const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === d.toDateString());
                     const hasLogs = dayLogs.length > 0;
                     
                     let bgClass = isFuture ? 'text-zinc-700 opacity-40 cursor-default' : 'text-zinc-300 hover:bg-zinc-800 cursor-pointer';
                     let glowClass = '';
                     
                     if (hasLogs) {
                         const dayCals = dayLogs.reduce((acc, log) => acc + log.calories, 0);
                         const diff = Math.abs(savedTarget - dayCals);
                         if (diff <= 100) { 
                             bgClass = 'bg-green-500/20 text-green-400 border border-green-500/50'; 
                             glowClass = 'drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]'; 
                         } else if (diff <= 250) { 
                             bgClass = 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'; 
                             glowClass = 'drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]'; 
                         } else { 
                             bgClass = 'bg-red-500/20 text-red-500 border border-red-500/50'; 
                             glowClass = 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' + (isSelected ? ' animate-pulse' : ''); 
                         }
                     }
                     
                     if (isSelected) {
                         if (!hasLogs) bgClass = 'bg-primary text-black font-black';
                         bgClass += ` scale-[1.15] ring-2 ring-white z-10 ${glowClass}`;
                     } else {
                         bgClass += ` ${glowClass}`;
                     }

                     return (
                         <div 
                           key={i} 
                           onClick={() => !isFuture && setSelectedDate(d)}
                           className={`relative w-9 h-9 mx-auto flex items-center justify-center rounded-full font-bold text-sm transition-all ${bgClass}`}
                         >
                             {d.getDate()}
                         </div>
                     );
                 })}
               </div>
            </div>

            {/* Daily Summaries from selectedDate */}
            <div className="glass-card p-6 bg-zinc-900/50 border-white/5 space-y-5 relative overflow-hidden">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-primary font-black uppercase tracking-widest">{selectedDate.toLocaleDateString('zh-TW')}</span>
                        <span className="text-xl font-black text-white">當日總結</span>
                    </div>
                    <span className="text-3xl font-black text-white leading-none">{totalCaloriesForDate} <span className="text-sm text-zinc-500 font-bold uppercase italic tracking-widest">cal</span></span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 items-center bg-zinc-800/40 p-3 rounded-2xl">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">蛋白質 P</span>
                       <span className="text-xl font-black text-blue-400">{Math.round(totalMacrosForDate.protein)}<span className="text-xs font-bold text-zinc-500">g</span></span>
                    </div>
                    <div className="flex flex-col gap-1 items-center bg-zinc-800/40 p-3 rounded-2xl">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">碳水 C</span>
                       <span className="text-xl font-black text-green-400">{Math.round(totalMacrosForDate.carbs)}<span className="text-xs font-bold text-zinc-500">g</span></span>
                    </div>
                    <div className="flex flex-col gap-1 items-center bg-zinc-800/40 p-3 rounded-2xl">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">脂肪 F</span>
                       <span className="text-xl font-black text-red-400">{Math.round(totalMacrosForDate.fat)}<span className="text-xs font-bold text-zinc-500">g</span></span>
                    </div>
                </div>
            </div>

           {/* Logs display */}
           <div className="space-y-4">
               {logs.filter((l) => new Date(l.timestamp).toDateString() === selectedDate.toDateString()).length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 font-bold border-2 border-dashed border-zinc-800 rounded-[32px]">
                      該日尚無飲食紀錄
                  </div>
               ) : (
                  logs.filter((l) => new Date(l.timestamp).toDateString() === selectedDate.toDateString()).map((log) => (
                    <div key={log.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-zinc-800/40 transition-all border-white/5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                        {log.imageUrl ? (
                           <img src={log.imageUrl} className="w-full h-full object-cover" alt={log.foodName} />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-zinc-800"><History size={20} className="text-zinc-600"/></div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-zinc-100 font-black text-lg truncate">{log.foodName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-primary font-black text-sm tracking-wide">{log.calories} cl</p>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase">| P:{log.protein} C:{log.carbs} F:{log.fat}</span>
                        </div>
                        {log.notes && <p className="text-zinc-500 text-[10px] mt-1 truncate max-w-[80%] border-l-2 border-zinc-700 pl-2">{log.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                         <button 
                           onClick={() => setEditingLog(log)}
                           className="p-3 text-zinc-600 hover:text-primary active:scale-90 transition-all"
                         >
                           <PenLine size={18} />
                         </button>
                         <button 
                           onClick={() => deleteLog(log.id)}
                           className="p-3 text-zinc-600 hover:text-rose-500 active:scale-90 transition-all"
                         >
                           <X size={18} />
                         </button>
                      </div>
                    </div>
                  ))
               )}
           </div>

           {/* History Guide Modal */}
           <AnimatePresence>
             {showHistoryGuide && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
                 onClick={() => setShowHistoryGuide(false)}
               >
                 <motion.div 
                   initial={{ scale: 0.9, y: 20 }} 
                   animate={{ scale: 1, y: 0 }} 
                   exit={{ scale: 0.9, y: 20 }}
                   onClick={(e) => e.stopPropagation()}
                   className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-6"
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-2xl font-black text-white">頁面功能指南</h3>
                       <p className="text-sm font-bold text-primary mt-1">如何掌握您的飲食歷史紀錄？</p>
                     </div>
                     <button onClick={() => setShowHistoryGuide(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                       <X size={20} />
                     </button>
                   </div>
                   
                   <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                       <div className="space-y-2">
                           <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded flex shrink-0"/> <h4 className="font-black text-white text-sm">統計儀表板</h4></div>
                           <p className="text-xs font-medium text-zinc-400 pl-6 leading-relaxed">
                             上半部的儀表板統整了您當月的紀綠進度。「當月紀錄天數」計算您有持續記錄不偷懶的天數比例。「指標達成品質」則是統計您本月所有紀錄中的達標狀態比例。
                           </p>
                       </div>

                       <div className="space-y-2">
                           <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-700 border border-white/20 rounded flex shrink-0"/> <h4 className="font-black text-white text-sm">月曆燈號標示</h4></div>
                           <p className="text-xs font-medium text-zinc-400 pl-6 leading-relaxed">
                             在月曆上，每一天都會根據當日最後結算的熱量，對應您的「目標熱量」進行誤差計算，並自動變色發光：
                           </p>
                           <ul className="text-xs font-medium text-zinc-400 pl-6 space-y-2 mt-1">
                               <li className="flex items-center gap-2"><span className="text-green-500 font-black">● 綠光 (良好):</span> 誤差在 100 Cal 以內，完美達標。</li>
                               <li className="flex items-center gap-2"><span className="text-yellow-400 font-black">● 黃光 (普通):</span> 誤差在 250 Cal 以內，稍微溢出或不足。</li>
                               <li className="flex items-center gap-2"><span className="text-red-500 font-black">● 紅光 (超標/不足):</span> <span className="text-zinc-300">誤差超過 250 Cal，嚴重暴吃或者吃太少！(點擊時會閃爍警示)</span></li>
                           </ul>
                       </div>

                       <div className="space-y-2">
                           <div className="flex items-center gap-2"><span className="text-xl">👉</span><h4 className="font-black text-white text-sm">如何補登紀錄？</h4></div>
                           <p className="text-xs font-medium text-zinc-400 pl-6 leading-relaxed">
                             如果您忘記記錄前幾天的飲食，請先在「月曆上點選那一天」，然後切換回底部的「首頁」進行掃描或手動登記。儲存時，您的紀錄會自動被「穿越時空」綁定到您選取的那一天，不會干擾今日的計算！
                           </p>
                       </div>
                   </div>
                   
                   <button 
                     onClick={() => setShowHistoryGuide(false)}
                     className="w-full bg-primary hover:bg-amber-500 text-black font-black py-3 rounded-xl transition-all shadow-lg active:scale-95 text-center block mt-6"
                   >
                     我了解了
                   </button>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 min-h-full select-none pt-4">
      {/* Account Settings */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-[11px] font-black uppercase tracking-widest pl-2">帳號設定</h3>
        <div className="glass-card bg-zinc-900/40 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden shadow-lg">
          <SettingsItem icon={<User size={18} className="text-zinc-400"/>} title="編輯個人資料" subtitle="更新您的頭像、姓名與聯繫方式" onClick={() => setIsProfileModalOpen(true)} />
          <SettingsItem icon={<Target size={18} className="text-zinc-400"/>} title="營養目標設定" subtitle="自訂每日熱量與三大營養素基準" onClick={() => setActiveTab('target')} />
        </div>
      </div>

      {/* Admin Panel (Only for Admin) */}
      {isAdmin && (
        <div className="space-y-3">
          <h3 className="text-primary text-[11px] font-black uppercase tracking-widest pl-2">管理員權限</h3>
          <div className="glass-card bg-primary/10 rounded-3xl border border-primary/20 overflow-hidden shadow-lg">
            <SettingsItem 
              icon={<Zap size={18} className="text-primary"/>} 
              title="管理者儀表板" 
              subtitle="查看系統總用戶數與數據成長" 
              onClick={() => setShowAdminPanel(true)} 
            />
          </div>
        </div>
      )}

      {/* App settings */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-[11px] font-black uppercase tracking-widest pl-2">應用程式設定</h3>
        <div className="glass-card bg-zinc-900/40 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden shadow-lg">
          <SettingsItem icon={<Bell size={18} className="text-zinc-400"/>} title="通知設定" subtitle="管理您的提醒與推播" onClick={() => setIsNotificationModalOpen(true)} />
          <SettingsItem icon={<Heart size={18} className="text-zinc-400"/>} title="歷史數據分析" subtitle="查看您的飲食與熱量趨勢" onClick={() => setActiveTab('activity')} />
        </div>
      </div>

      {/* Support */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-[11px] font-black uppercase tracking-widest pl-2">支援與幫助</h3>
        <div className="glass-card bg-zinc-900/40 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden shadow-lg">
          <SettingsItem icon={<HelpCircle size={18} className="text-zinc-400"/>} title="幫助與客服" subtitle="尋求應用程式的相關協助" onClick={() => setDocModalType('help')} />
          <SettingsItem icon={<Shield size={18} className="text-zinc-400"/>} title="隱私權政策" subtitle="閱讀我們的隱私權條款" onClick={() => setDocModalType('privacy')} />
        </div>
      </div>

      {/* Sign Out Button */}
      <button 
        onClick={async () => {
          if (confirm('確定要登出嗎？您的紀錄將保存在雲端。')) {
            await supabase.auth.signOut();
            setIsLoggedIn(false);
            setAuthEmail('');
            setAuthPassword('');
            setLogs([]);
            // Reset to defaults
              setUserProfile({
                name: '',
                avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                email: '',
                phone: '',
                password: '00000000',
                gender: 'male',
                age: 25,
                height: 175,
                weight: 70,
                activity: 1.2,
                goal: 'maintain',
                hasSetTarget: false,
                targetCalories: 2000
              });
          }
        }}
        className="w-full mt-4 bg-zinc-900/80 hover:bg-zinc-800 text-white font-black py-4 rounded-3xl border border-white/5 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl group"
      >
         <LogOut size={20} className="text-zinc-500 group-hover:text-rose-500 transition-colors"/>
         <span className="tracking-wide group-hover:text-rose-500 transition-colors font-black">完全登出 Sign Out</span>
      </button>
    </div>
  );

  const renderProfileModal = () => (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-8">
        <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
           <X size={28} />
        </button>
        <h2 className="text-xl font-black text-white">編輯個人資料</h2>
        <button 
          disabled={isAuthLoading}
          onClick={async () => {
            if (!userProfile.name.trim()) {
              alert('【必要步驟】請填寫您的顯示姓名以開始使用');
              return;
            }
            
            setIsAuthLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase.from('profiles').update({
                  name: userProfile.name,
                  phone: userProfile.phone,
                  gender: userProfile.gender,
                  age: userProfile.age,
                  height: userProfile.height,
                  weight: userProfile.weight,
                  goal: userProfile.goal,
                  activity: userProfile.activity,
                  password: userProfile.password,
                  has_set_target: userProfile.hasSetTarget,
                  target_calories: userProfile.targetCalories
                }).eq('id', user.id);
                
                if (error) throw error;
              }
              setIsProfileModalOpen(false);
              alert('🦄 個人資料同步成功！');
            } catch (err) {
              alert('同步失敗，但已保存在本地');
              setIsProfileModalOpen(false);
            } finally {
              setIsAuthLoading(false);
            }
          }}
          className="text-primary font-black text-lg disabled:opacity-50"
        >
          {isAuthLoading ? '同步中...' : '儲存'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-8 no-scrollbar">
        {/* Welcome Banner for New Users */}
        {!userProfile.name && (
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-2">
            <h3 className="text-primary font-black text-xl mb-1 flex items-center gap-2">最後一步！<PenLine size={20}/></h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              歡迎加入 PhotoCalorie！請填入您的<span className="text-white">姓名</span>以解鎖所有系統功能。其餘資料皆可由您決定是否填寫。
            </p>
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center py-4">
          <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect} />
          <div 
            className="w-32 h-32 rounded-full border-4 border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl relative group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <img src={userProfile.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Profile" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <ImageIcon className="text-white" size={32} />
            </div>
          </div>
          <button 
            className="mt-4 text-primary font-bold text-sm tracking-widest uppercase italic"
            onClick={() => avatarInputRef.current?.click()}
          >
            更換大頭貼
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">顯示姓名 <span className="text-primary">*必要</span></label>
            </div>
            <div className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-all shadow-inner ring-1 ring-primary/20">
              <input 
                type="text" 
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({...prev, name: e.target.value}))}
                className="bg-transparent text-white font-black w-full outline-none text-lg"
                placeholder="請輸入您的真實姓名或暱稱"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">帳號信箱 (登入憑證)</label>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">不可變更</span>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 opacity-60">
              <input 
                type="email" 
                value={userProfile.email}
                readOnly
                className="bg-transparent text-zinc-500 font-bold w-full outline-none text-lg cursor-not-allowed"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">電話號碼</label>
            <div className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-all shadow-inner">
              <input 
                type="tel" 
                value={userProfile.phone || ''}
                onChange={(e) => setUserProfile(prev => ({...prev, phone: e.target.value}))}
                className="bg-transparent text-white font-bold w-full outline-none text-lg"
                placeholder="請輸入電話號碼"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">登入密碼</label>
              <span className="text-[9px] font-bold text-zinc-600 tracking-tighter italic">僅限 8 位數字</span>
            </div>
            <div className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-all shadow-inner relative">
              <input 
                type={showPassword ? "text" : "password"} 
                maxLength={8}
                value={userProfile.password || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setUserProfile(prev => ({...prev, password: val}));
                }}
                className="bg-transparent text-white font-bold w-full outline-none text-lg tracking-[0.5em] pr-10"
                placeholder="00000000"
                inputMode="numeric"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
           <p className="text-[11px] text-zinc-500 leading-relaxed italic">
             提示：以上資料僅用於個人化您的 App 體驗。我們嚴格遵守隱私權政策，絕不會將您的聯繫資訊透漏予第三方。
           </p>
        </div>
      </div>
    </div>
  );

  const renderDocModal = () => (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-sm max-h-[80vh] bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl relative flex flex-col"
      >
        <button onClick={() => setDocModalType(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors z-10 shrink-0 shadow-md">
          <X size={20} />
        </button>
        <h3 className="text-2xl font-black text-white mb-6 pr-8">
           {docModalType === 'help' ? '幫助與客服' : '隱私權政策'}
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
           {docModalType === 'help' && (
                <div className="space-y-4 text-zinc-300 text-sm leading-relaxed pb-4">
                  <h4 className="text-white font-bold text-lg mb-2">使用常見問題</h4>
                  <p><strong className="text-primary">Q: 照片辨識失敗怎麼辦？</strong><br/>A: 請確保食物光線充足、主體清晰。若多次失敗，您可以從首頁選擇「手動補登」來輸入攝取紀錄。</p>
                  <p><strong className="text-primary">Q: 換手機或清除快取會讓紀錄不見嗎？</strong><br/>A: 不會！本系統由 Vercel 託管並深度整合 Supabase 企業級雲端資料庫。您的紀錄會自動加密同步至雲端，隨時切換設備或轉換成 App 都能無縫接軌。</p>
                  <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl mt-6 shadow-inner">
                    <h5 className="text-primary font-black mb-1">免責聲明 (Medical Disclaimer)</h5>
                    <p className="text-xs text-primary/80 font-medium">本 App 提供的飲食營養數據僅供參考，不具備專業醫療診斷、處方或治療依據。若有特殊疾病或醫療需求，請諮詢專業醫師或營養師。</p>
                  </div>
                  <h4 className="text-white font-bold text-lg mt-6 mb-2">聯絡客服</h4>
                  <p>若您遇到任何註冊登入、資料同步等問題，請寄信至：<br/><a href="mailto:a0903383712@gmail.com" className="text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer">a0903383712@gmail.com</a></p>
                </div>
           )}
           {docModalType === 'privacy' && (
                <div className="space-y-4 text-zinc-300 text-sm leading-relaxed pb-4">
                  <h4 className="text-white font-bold text-lg mb-2">資料收集與隱私管理</h4>
                  <p>PhotoCalorie 致力於保護您的隱私。本政策旨在說明我們如何收集、使用與保護您的個人資料。</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">圖片處理：</strong>您上傳的照片僅用於即時智慧營養素分析，分析後圖片不會永久儲存於我們的伺服器，保障您的飲食隱私。</li>
                    <li><strong className="text-white">雲端基礎架構：</strong>本應用程式託管於最高安全標準的 Vercel 平台，並採用 Supabase 作為核心資料庫。您的個人設定與飲食歷史皆透過 TLS 加密連線傳輸，安全儲存於雲端設施。</li>
                    <li><strong className="text-white">第三方服務：</strong>我們調用安全的雲端商用模型處理圖像。在上傳請求中，我們絕不會夾帶您的帳號名稱或信箱等敏感可識別資訊。</li>
                  </ul>
                  <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl mt-6 shadow-inner">
                    <h5 className="text-primary font-black mb-1">健康聲明條款</h5>
                    <p className="text-xs text-primary/80 font-medium">本 App 提供的飲食營養數據、卡路里計算與分析報告僅供參考，不具備專業醫療診斷、處方或治療依據。若您患有特殊代謝疾病或醫療需求，請務必諮詢專業醫師或營養師。</p>
                  </div>
                </div>
           )}
        </div>
      </motion.div>
    </div>
  );

  const renderInstallPrompt = () => (
    <div className="fixed bottom-2 left-0 right-0 z-[200] p-4 flex flex-col items-center justify-end pointer-events-none pb-6">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative max-w-[90%] pointer-events-auto"
      >
        <button 
          onClick={() => {
            setShowInstallPrompt(false);
            sessionStorage.setItem('dismissedInstallPrompt', 'true');
          }} 
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
        <div className="flex gap-4 items-start pr-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white via-zinc-400 to-zinc-800 flex items-center justify-center shrink-0 shadow-lg mt-1 relative overflow-hidden border border-white/20">
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"></div>
             <span className="text-black font-black text-xl italic tracking-tighter relative z-10 drop-shadow-sm">OZ</span>
          </div>
          <div>
            <h4 className="text-white font-black text-[15px] leading-tight mb-1">獲取全螢幕 App 體驗</h4>
            <p className="text-zinc-400 text-xs font-medium leading-relaxed">
              點擊下方的 <strong className="text-primary"><Share size={12} className="inline mb-0.5 mx-0.5"/></strong> 分享按鈕，接著下滑點選 <strong className="text-white"><PlusSquare size={12} className="inline mb-0.5 mx-0.5"/> 加入主畫面</strong>。
            </p>
          </div>
        </div>
        
        {/* Animated Arrow Pointing Down to Safari Share Button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-zinc-900/95 backdrop-blur-xl drop-shadow-md">
           <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12L0 0H24L12 12Z" />
          </svg>
        </div>
      </motion.div>
    </div>
  );

  const renderAdminDashboard = () => (
    <AnimatePresence>
      {showAdminPanel && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[800] bg-black backdrop-blur-3xl overflow-y-auto no-scrollbar"
        >
          <div className="max-w-md mx-auto px-6 py-10 space-y-8">
            <div className="flex justify-between items-center">
               <div>
                  <h2 className="text-3xl font-black text-white">管理中心</h2>
                  <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mt-1">Super Admin Console</p>
               </div>
               <button onClick={() => setShowAdminPanel(false)} className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-400">
                  <X size={24} />
               </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-900/80 border border-white/5 p-6 rounded-[32px] space-y-2">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">總註冊人口</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{adminStats?.totalUsers}</span>
                    <span className="text-zinc-600 text-xs font-bold uppercase italic">Users</span>
                  </div>
               </div>
               <div className="bg-zinc-900/80 border border-white/5 p-6 rounded-[32px] space-y-2">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">總照片辨識次數</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{adminStats?.totalPhotoUsage}</span>
                    <span className="text-zinc-600 text-xs font-bold uppercase italic">Times</span>
                  </div>
               </div>
            </div>

            {/* Global Broadcast Section */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-2">
                  <Zap size={16} className="text-primary animate-pulse" />
                  <h3 className="text-lg font-black text-white">全體系統廣播</h3>
               </div>
               <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 space-y-4 shadow-xl">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">廣播標題 (全體可見)</label>
                     <input 
                        type="text"
                        placeholder="例如：系統維護公告 / 週末運動鼓勵"
                        className="w-full bg-zinc-900/60 border-none rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                        value={adminMsgFormData.title}
                        onChange={(e) => setAdminMsgFormData({ ...adminMsgFormData, title: e.target.value })}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">廣播內容</label>
                     <textarea 
                        placeholder="輸入要發送給所有學員的訊息..."
                        className="w-full bg-zinc-900/60 border-none rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 text-sm font-medium min-h-[100px] resize-none"
                        value={adminMsgFormData.content}
                        onChange={(e) => setAdminMsgFormData({ ...adminMsgFormData, content: e.target.value })}
                     />
                  </div>
                  <button 
                     onClick={sendGlobalBroadcast}
                     disabled={isBroadcastingGlobal || !adminMsgFormData.title || !adminMsgFormData.content}
                     className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                     <Shield size={20} />
                     {isBroadcastingGlobal ? '全球廣播中...' : '發送全體廣播'}
                  </button>
               </div>
            </div>

            {/* User List */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-lg font-black text-white">最近註冊用戶</h3>
                  <TrendingUp className="text-green-500" size={20} />
               </div>
               <div className="space-y-3">
                  {adminStats?.recentGrowth.map((u: any) => (
                     <div 
                        key={u.id} 
                        onClick={() => fetchUserDetails(u)}
                        className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 active:scale-95 transition-all cursor-pointer hover:bg-zinc-800/60"
                     >
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                           {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="text-zinc-600"/>}
                        </div>
                        <div className="flex-1">
                           <p className="text-white font-black text-sm">{u.name || u.email.split('@')[0]}</p>
                           <p className="text-zinc-500 text-[10px] font-medium">{new Date(u.created_at).toLocaleDateString()} 加入</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-700" />
                     </div>
                  ))}
               </div>
            </div>

            {/* User Detail Modal Sub-layer */}
            <AnimatePresence>
              {selectedAdminUser && (
                <motion.div 
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  className="fixed inset-0 z-[850] bg-zinc-950 p-6 flex flex-col space-y-8"
                >
                  <div className="flex items-center gap-4">
                     <button onClick={() => { setSelectedAdminUser(null); setSelectedUserStats(null); }} className="p-3 bg-zinc-900 rounded-2xl text-zinc-400">
                        <ChevronLeft size={24} />
                     </button>
                     <h3 className="text-xl font-black text-white">用戶深度報告</h3>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-6">
                     <div className="w-32 h-32 rounded-[40px] bg-zinc-900 border-2 border-white/10 overflow-hidden shadow-2xl">
                        {selectedAdminUser.avatar_url ? (
                           <img src={selectedAdminUser.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center"><User size={48} className="text-zinc-700" /></div>
                        )}
                     </div>
                     <div className="text-center">
                        <h4 className="text-2xl font-black text-white">{selectedAdminUser.name || '未命名學員'}</h4>
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">Premium Member</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="bg-zinc-900/60 rounded-3xl p-6 border border-white/5 space-y-5">
                        <div className="flex justify-between items-center bg-zinc-800/30 p-4 rounded-2xl">
                           <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">帳號 Email</span>
                           <span className="text-zinc-200 font-bold select-all">{selectedAdminUser.email}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-800/30 p-4 rounded-2xl">
                           <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">登入密碼</span>
                           <span className="text-primary font-black tracking-[0.3em]">{selectedAdminUser.password || '********'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-800/30 p-4 rounded-2xl">
                           <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">連絡電話</span>
                           <span className="text-zinc-200 font-bold">{selectedAdminUser.phone || '未填寫'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-800/30 p-4 rounded-2xl border border-primary/20">
                           <span className="text-[11px] font-black text-primary uppercase tracking-widest">累積照片辨識次數</span>
                           <span className="text-white text-xl font-black italic">{selectedUserStats?.photoUsage || 0} <span className="text-xs uppercase">Times</span></span>
                        </div>
                     </div>
                  </div>

                  {/* Messaging Section */}
                  <div className="space-y-4 pt-4">
                     <div className="flex items-center gap-2 px-2">
                        <Mail size={16} className="text-primary" />
                        <h4 className="text-lg font-black text-white">發送系統通知</h4>
                     </div>
                     <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4 shadow-inner">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">訊息標題</label>
                           <input 
                              type="text"
                              placeholder="例如：加油！今天的蛋白質達標囉"
                              className="w-full bg-zinc-800/50 border-none rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                              value={adminMsgFormData.title}
                              onChange={(e) => setAdminMsgFormData({ ...adminMsgFormData, title: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">訊息內容</label>
                           <textarea 
                              placeholder="輸入您想對學員說的話..."
                              className="w-full bg-zinc-800/50 border-none rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 text-sm font-medium min-h-[120px] resize-none"
                              value={adminMsgFormData.content}
                              onChange={(e) => setAdminMsgFormData({ ...adminMsgFormData, content: e.target.value })}
                           />
                        </div>
                        <button 
                           onClick={sendAdminMessage}
                           disabled={isAdminSending || !adminMsgFormData.title || !adminMsgFormData.content}
                           className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                           {isAdminSending ? '派送中...' : '立即發送訊息'}
                           <ArrowRight size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="p-6 bg-zinc-900/40 rounded-3xl border border-white/5 text-[11px] text-zinc-500 font-medium leading-relaxed">
                     <div className="flex items-center gap-2 mb-2 text-zinc-400 font-black">
                        <Shield size={14} /> 隱私管理說明
                     </div>
                     管理員僅限基於課程輔導與系統營運目的查看學員資料。請遵守隱私權政策，勿將學員密碼或連絡資訊外洩給任何第三方。
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-8 bg-primary/5 rounded-[40px] border border-primary/20 text-center space-y-3">
               <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
                  <Shield size={24} />
               </div>
               <p className="text-zinc-300 text-sm font-medium leading-relaxed">
                  目前系統運算正常。<br/>
                  OpenAI API 調用順暢，AWS 圖片暫存空間剩餘充足。
               </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderInboxModal = () => (
    <AnimatePresence>
      {isInboxOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ y: 20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.95 }}
            className="w-full max-w-md h-[80vh] bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-2xl font-black text-white">收件夾</h3>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-0.5">System Inbox</p>
              </div>
              <button 
                onClick={() => setIsInboxOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-all shadow-lg active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {inboxMessages.length > 0 ? (
                inboxMessages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         {!msg.is_read && <div className="w-2 h-2 bg-primary rounded-full opacity-80" />}
                         <h4 className={`font-black text-zinc-100 text-[15px] ${!msg.is_read ? 'text-white' : 'text-zinc-400'}`}>{msg.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                      {msg.content}
                    </p>
                    <div className="h-px w-full bg-white/5 group-last:hidden" />
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                   <MailOpen size={48} className="text-zinc-700" />
                   <p className="font-bold text-zinc-500">尚無系統郵件</p>
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="p-6 bg-zinc-900/80 border-t border-white/5 text-center">
               <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                 重要通知將會發送至此，請定期查閱
               </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderAuth = () => (
    <div className="fixed inset-0 bg-black z-[500] overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
         <img 
           src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80" 
           className="w-full h-full object-cover opacity-60"
           alt="Background"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between px-8 py-12">
        {/* Title Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center pt-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-white via-zinc-400 to-zinc-900 rounded-[22px] flex items-center justify-center text-black font-black text-2xl italic mx-auto mb-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/30 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
             <span className="relative z-10 drop-shadow-md">OZ</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight leading-none mb-2">
            Welcome to<br/>
            <span className="text-primary tracking-tighter italic text-4xl uppercase">PhotoCalorie</span>
          </h1>
          <p className="text-zinc-400 font-medium text-sm">Achieve your body goals with us.</p>
        </motion.div>

        {/* Auth Form Section */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white">{isLoginMode ? '歡迎回來' : '建立新帳號'}</h2>
            <p className="text-zinc-500 text-xs font-medium">{isLoginMode ? '登入即刻開啟健康之旅' : '簡易註冊，數據永遠同步雲端'}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">帳號名稱 (Email)</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus-within:border-primary/50 transition-all">
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-transparent text-white font-bold w-full outline-none text-base"
                  placeholder="請輸入註冊信箱"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">密碼 (8 位數字)</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus-within:border-primary/50 transition-all relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  maxLength={8}
                  inputMode="numeric"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="bg-transparent text-white font-bold w-full outline-none text-base tracking-[0.5em] pr-12"
                  placeholder="••••••••"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600">
                   {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button 
              disabled={isAuthLoading}
              onClick={async () => {
                if (authEmail && authPassword.length === 8) {
                  setIsAuthLoading(true);
                  try {
                    if (isLoginMode) {
                      // Login Logic
                      const { data, error } = await supabase.auth.signInWithPassword({
                        email: authEmail.trim(),
                        password: authPassword,
                      });
                      if (error) throw error;
                      setIsLoggedIn(true);
                      if (data.user) loadUserData(data.user.id);
                    } else {
                      // Register Logic
                      const { data, error } = await supabase.auth.signUp({
                        email: authEmail.trim(),
                        password: authPassword,
                      });
                      if (error) throw error;
                      
                      // Create initial profile in profiles table
                      if (data.user) {
                        await supabase.from('profiles').insert([{
                          id: data.user.id,
                          email: authEmail.trim(),
                          name: '',
                          password: authPassword
                        }]);
                        loadUserData(data.user.id);
                      }
                      
                      setIsLoggedIn(true);
                      setIsProfileModalOpen(true);
                    }
                  } catch (err: any) {
                    alert('連線失敗: ' + (err.message || '請檢查網路設定'));
                  } finally {
                    setIsAuthLoading(false);
                  }
                } else {
                  alert('請填寫完整資訊（密碼需為 8 位數字）');
                }
              }}
              className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4.5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 text-lg mt-2 flex items-center justify-center py-4 disabled:opacity-50"
            >
              {isAuthLoading ? '處理中...' : (isLoginMode ? '立即登入' : '完成註冊')}
            </button>

            <button 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="w-full text-zinc-500 font-bold text-xs hover:text-white transition-colors pt-2"
            >
              {isLoginMode ? '還沒有帳號？ 按此快速註冊' : '已經有帳號？ 點我返回登入'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-50 font-['Outfit'] selection:bg-primary/30">
        {!isLoggedIn && renderAuth()}
      {/* Content Wrapper */}
      <div className="max-w-md mx-auto h-screen relative flex flex-col pt-4 overflow-hidden">
        
        {/* Main View Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          {!isLoggedIn ? (
             <div className="h-full flex items-center justify-center opacity-40">
                <RefreshCcw className="animate-spin" />
             </div>
          ) : (
            <>
              {activeTab === 'home' && renderHome()}
              {activeTab === 'target' && renderTarget()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="absolute bottom-[2%] left-6 right-6 h-20 bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-between px-2 shadow-2xl z-50">
          <TabButton id="home" activeTab={activeTab} setTab={setActiveTab} icon={<Home size={24} />} label="首頁" />
          <TabButton id="activity" activeTab={activeTab} setTab={setActiveTab} icon={<History size={24} />} label="歷史" />
          
          {/* Main Scan Button */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCapturing(true)}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(245,158,11,0.5)] border-4 border-black -mt-10"
          >
            <Scan size={32} strokeWidth={3} />
          </motion.button>

          <TabButton id="target" activeTab={activeTab} setTab={setActiveTab} icon={<Target size={24} />} label="目標" />
          <TabButton id="settings" activeTab={activeTab} setTab={setActiveTab} icon={<Settings size={24} />} label="設定" />
        </div>

        {/* Scan Overlay */}
        <AnimatePresence>
          {isCapturing && renderScanOverlay()}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileModalOpen && renderProfileModal && renderProfileModal()}
        </AnimatePresence>

        <AnimatePresence>
          {docModalType && renderDocModal && renderDocModal()}
        </AnimatePresence>

        {renderAdminDashboard && renderAdminDashboard()}

        <AnimatePresence>
          {editingLog && (
            <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 text-left">
              <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">修改飲食紀錄</h3>
                  <button onClick={() => setEditingLog(null)} className="text-zinc-500"><X size={24}/></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-500 uppercase pl-1 block">食物名稱</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white font-bold"
                      value={editingLog.foodName}
                      onChange={e => setEditingLog({...editingLog, foodName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black text-zinc-500 uppercase pl-1 block">熱量 (kcal)</label>
                      <input 
                        type="number" 
                        className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white font-bold"
                        value={editingLog.calories}
                        onChange={e => setEditingLog({...editingLog, calories: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black text-zinc-500 uppercase pl-1 block">蛋白質 (g)</label>
                      <input 
                        type="number" 
                        className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white font-bold"
                        value={editingLog.protein}
                        onChange={e => setEditingLog({...editingLog, protein: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black text-blue-400/80 uppercase pl-1 block">碳水 (g)</label>
                      <input 
                        type="number" 
                        className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white font-bold"
                        value={editingLog.carbs}
                        onChange={e => setEditingLog({...editingLog, carbs: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black text-rose-400/80 uppercase pl-1 block">脂肪 (g)</label>
                      <input 
                        type="number" 
                        className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white font-bold"
                        value={editingLog.fat}
                        onChange={e => setEditingLog({...editingLog, fat: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={updateLog}
                  className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all mt-4"
                >
                  確認修改
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isNotificationModalOpen && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
             >
                <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8 text-center">
                   <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
                      <Bell size={40} className="text-primary animate-bounce" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">開啟手機通知</h3>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                        當檢測到您漏記餐次時，系統會直接在您的手機螢幕上彈出溫馨提醒。
                      </p>
                   </div>
                   
                   <div className="space-y-3">
                      <button 
                        onClick={requestNotificationPermission}
                        className="w-full bg-primary hover:bg-amber-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg"
                      >
                        {notificationPermission === 'granted' ? '✅ 已開啟通知' : '立即開啟提醒'}
                      </button>
                      <button 
                        onClick={() => setIsNotificationModalOpen(false)}
                        className="w-full text-zinc-500 font-bold text-sm"
                      >
                        先不需要，以後再說
                      </button>
                   </div>
                   
                   <div className="p-3 bg-white/5 rounded-xl text-[10px] text-zinc-500 font-bold leading-snug">
                     提示：若是在 iOS 系統，請務必先將此網頁「加入主畫面」方可正常接收通知。
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isInboxOpen && renderInboxModal && renderInboxModal()}
        </AnimatePresence>

        {renderManualAddModal()}
      </div>
    </div>
  );
}

const InputGroup = ({ label, value, unit, onChange }: { label: string, value: any, unit: string, onChange: (v: any) => void }) => (
  <div className="space-y-3">
    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest italic">{label}</label>
    <div className="flex items-center gap-4 bg-black/20 border border-zinc-900 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xl font-black w-full outline-none text-white tabular-nums" 
      />
      <span className="text-zinc-600 font-black text-sm italic">{unit}</span>
    </div>
  </div>
);

const TabButton = ({ id, activeTab, setTab, icon, label }: { id: any, activeTab: any, setTab: any, icon: any, label: string }) => (
  <button 
    onClick={() => setTab(id)}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all gap-1 ${activeTab === id ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SettingsItem = ({ icon, title, subtitle, onClick }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-4 px-5 hover:bg-white/5 cursor-pointer transition-colors group active:bg-white/10">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors shadow-inner">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-zinc-200 font-bold text-[15px] transition-colors group-hover:text-primary">{title}</span>
        <span className="text-zinc-500 text-[11px] font-medium leading-none">{subtitle}</span>
      </div>
    </div>
    <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
  </div>
);

export default App;
