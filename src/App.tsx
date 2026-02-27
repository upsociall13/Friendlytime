import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  Info, 
  Search, 
  UserCircle, 
  Menu, 
  X, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Languages, 
  Clock, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Heart,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'friend';
  city: string;
  age: number;
  languages: string;
  interests: string;
  about: string;
  hourly_rate: number;
  verified: number;
  rating: number;
}

interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

// --- Components ---

const ChatWidget = ({ 
  friend, 
  onClose, 
  currentUserId = 1 // Mock current user ID
}: { 
  friend: User; 
  onClose: () => void;
  currentUserId?: number;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch history
    fetch(`/api/messages/${currentUserId}/${friend.id}`)
      .then(res => res.json())
      .then(data => setMessages(data));

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: 'auth', userId: currentUserId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat' && data.senderId === friend.id) {
        setMessages(prev => [...prev, {
          sender_id: data.senderId,
          receiver_id: currentUserId,
          content: data.content,
          created_at: data.createdAt
        }]);
      }
    };

    return () => ws.current?.close();
  }, [friend.id, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !ws.current) return;

    const msg = {
      type: 'chat',
      senderId: currentUserId,
      receiverId: friend.id,
      content: input
    };

    ws.current.send(JSON.stringify(msg));
    setMessages(prev => [...prev, {
      sender_id: currentUserId,
      receiver_id: friend.id,
      content: input,
      created_at: new Date().toISOString()
    }]);
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col z-[100] overflow-hidden"
    >
      <div className="p-4 bg-zinc-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={`https://picsum.photos/seed/${friend.id}/100/100`} className="w-8 h-8 rounded-full object-cover" />
          <div>
            <div className="text-sm font-bold">{friend.name}</div>
            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Online</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex flex-col max-w-[80%]",
            msg.sender_id === currentUserId ? "ml-auto items-end" : "items-start"
          )}>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-sm",
              msg.sender_id === currentUserId 
                ? "bg-rose-600 text-white rounded-tr-none" 
                : "bg-white text-zinc-900 border border-zinc-100 rounded-tl-none shadow-sm"
            )}>
              {msg.content}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-100 bg-white">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..." 
            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <button 
            onClick={sendMessage}
            className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">FriendlyTime</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-rose-600 transition-colors">Home</Link>
            <Link to="/how-it-works" className="text-sm font-medium text-zinc-600 hover:text-rose-600 transition-colors">How It Works</Link>
            <Link to="/browse" className="text-sm font-medium text-zinc-600 hover:text-rose-600 transition-colors">Browse Friends</Link>
            <Link to="/safety" className="text-sm font-medium text-zinc-600 hover:text-rose-600 transition-colors">Safety</Link>
            <div className="flex items-center space-x-4 ml-4">
              <button className="text-sm font-semibold text-zinc-900 px-4 py-2 hover:bg-zinc-50 rounded-full transition-colors">Login</button>
              <button className="text-sm font-semibold bg-rose-600 text-white px-5 py-2 rounded-full hover:bg-rose-700 transition-all shadow-sm shadow-rose-200">Sign Up</button>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link to="/" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-md">Home</Link>
              <Link to="/how-it-works" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-md">How It Works</Link>
              <Link to="/browse" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-md">Browse Friends</Link>
              <Link to="/safety" className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-md">Safety</Link>
              <div className="pt-4 flex flex-col space-y-2">
                <button className="w-full text-center py-3 font-semibold text-zinc-900 border border-zinc-200 rounded-xl">Login</button>
                <button className="w-full text-center py-3 font-semibold bg-rose-600 text-white rounded-xl">Sign Up</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-zinc-900 text-zinc-400 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FriendlyTime</span>
          </div>
          <p className="text-sm leading-relaxed max-w-md">
            The safest platform for social companionship. Hire verified friends for events, travel, movies, and more. Strictly for social purposes only.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/browse" className="hover:text-rose-400">Browse Friends</Link></li>
            <li><Link to="/how-it-works" className="hover:text-rose-400">How It Works</Link></li>
            <li><Link to="/safety" className="hover:text-rose-400">Safety & Legal</Link></li>
            <li><Link to="/terms" className="hover:text-rose-400">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>support@friendlytime.com</li>
            <li>Help Center</li>
            <li>Report an Issue</li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-zinc-800 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 FriendlyTime. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white">Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

const Hero = () => (
  <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-rose-700 uppercase bg-rose-50 rounded-full">
            Safe • Verified • Social
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 mb-8 leading-[1.1]">
            Hire a Friend for <span className="text-rose-600 italic font-serif">Events</span>, Travel & Social Occasions.
          </h1>
          <p className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl">
            Find verified companions for movies, weddings, fitness, or just a friendly conversation. Safe, legal, and strictly social.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/browse" className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2">
              Find a Friend <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-100 rounded-2xl font-bold text-lg hover:border-rose-200 transition-all flex items-center justify-center gap-2">
              Become a Friend
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    
    {/* Background Elements */}
    <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
      <div className="relative h-full w-full">
        <div className="absolute top-20 right-20 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30" />
        <img 
          src="https://picsum.photos/seed/friends/800/1000" 
          alt="Happy Friends" 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] object-cover rounded-[40px] shadow-2xl rotate-3"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  </section>
);

const ProfileCard = ({ friend }: { friend: User; key?: any }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
  >
    <div className="relative h-64 overflow-hidden">
      <img 
        src={`https://picsum.photos/seed/${friend.id}/400/500`} 
        alt={friend.name} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span className="text-xs font-bold text-zinc-900">{friend.rating}</span>
      </div>
      {friend.verified && (
        <div className="absolute top-4 right-4 bg-rose-500 text-white p-1.5 rounded-full shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}
    </div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">{friend.name}, {friend.age}</h3>
          <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {friend.city}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-rose-600">₹{friend.hourly_rate}</div>
          <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Per Hour</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 my-4">
        {friend.interests.split(',').map(interest => (
          <span key={interest} className="px-2.5 py-1 bg-zinc-50 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
            {interest.trim()}
          </span>
        ))}
      </div>
      
      <p className="text-sm text-zinc-500 line-clamp-2 mb-6 leading-relaxed">
        {friend.about}
      </p>
      
      <Link 
        to={`/friend/${friend.id}`}
        className="block w-full text-center py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
      >
        View Profile
      </Link>
    </div>
  </motion.div>
);

// --- Pages ---

const HomePage = () => {
  const [friends, setFriends] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/friends')
      .then(res => res.json())
      .then(data => setFriends(data.slice(0, 3)));
  }, []);

  return (
    <div>
      <Hero />
      
      {/* Features */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 mb-4">Why Choose FriendlyTime?</h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">We prioritize safety, legality, and genuine human connection above all else.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Verified Profiles", desc: "Every friend undergoes Aadhaar/ID verification and mobile OTP checks for your safety." },
              { icon: MessageSquare, title: "In-App Chat", desc: "Communicate securely through our platform without sharing personal phone numbers initially." },
              { icon: Clock, title: "Flexible Booking", desc: "Hire companions for 1 hour, 3 hours, or a full day based on your specific needs." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="text-rose-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Friends */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 mb-4">Featured Friends</h2>
              <p className="text-zinc-600">Discover top-rated companions in your city.</p>
            </div>
            <Link to="/browse" className="hidden md:flex items-center gap-2 text-rose-600 font-bold hover:gap-3 transition-all">
              View All Friends <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {friends.map(friend => (
              <ProfileCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      </section>

      {/* Safety Banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-100 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="text-amber-600 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Strict Social Companionship Only</h3>
              <p className="text-zinc-600 leading-relaxed">
                FriendlyTime is strictly for social purposes. We have a zero-tolerance policy for any illegal activities, escort services, or physical intimacy. Violators will be permanently banned and reported to legal authorities.
              </p>
            </div>
            <Link to="/safety" className="shrink-0 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">
              Read Safety Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const BrowsePage = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/friends')
      .then(res => res.json())
      .then(data => {
        setFriends(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="py-16 bg-zinc-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">Browse Friends</h1>
            <p className="text-zinc-600">Find the perfect companion for your next activity.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search city or interest..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-full md:w-64"
              />
            </div>
            <button className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[450px] bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {friends.map(friend => (
              <ProfileCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FriendProfilePage = () => {
  const { id } = useParams();
  const [friend, setFriend] = useState<User | null>(null);
  const [selectedActivity, setSelectedActivity] = useState("Movie Partner");
  const [selectedDuration, setSelectedDuration] = useState("1 Hour");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/friends/${id}`)
        .then(res => res.json())
        .then(data => setFriend(data));
    }
  }, [id]);

  if (!friend) return <div className="py-20 text-center">Loading...</div>;

  const getDurationHours = (duration: string) => {
    if (duration === "1 Hour") return 1;
    if (duration === "3 Hours") return 3;
    if (duration === "Half Day (6 Hours)") return 6;
    if (duration === "Full Day (12 Hours)") return 12;
    return 1;
  };

  const totalCost = friend.hourly_rate * getDurationHours(selectedDuration);

  const handleConfirmBooking = async () => {
    setIsBookingLoading(true);
    // Mock booking API call
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 1, // Mock customer ID
          friendId: friend.id,
          activity: selectedActivity,
          duration: selectedDuration
        })
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (response.ok) {
        setIsBookingLoading(false);
        setIsBookingSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setIsBookingSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Booking failed", error);
      setIsBookingLoading(false);
    }
  };

  return (
    <div className="py-12 bg-zinc-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <img 
                  src={`https://picsum.photos/seed/${friend.id}/400/500`} 
                  alt={friend.name} 
                  className="w-full md:w-64 h-80 object-cover rounded-3xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-zinc-900">{friend.name}, {friend.age}</h1>
                    {friend.verified && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-zinc-500 text-sm mb-6">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {friend.city}</div>
                    <div className="flex items-center gap-1.5"><Languages className="w-4 h-4" /> {friend.languages}</div>
                    <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {friend.rating} (12 Reviews)</div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 mb-3">About Me</h3>
                  <p className="text-zinc-600 leading-relaxed mb-6">
                    {friend.about}
                  </p>
                  
                  <div className="flex gap-4 mb-8">
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" /> Chat Now
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 border border-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-all">
                      <Heart className="w-4 h-4" /> Save
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {friend.interests.split(',').map(interest => (
                      <span key={interest} className="px-3 py-1.5 bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-100">
                        {interest.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm">
              <h3 className="text-2xl font-bold text-zinc-900 mb-6">Availability Calendar</h3>
              <div className="grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-zinc-400 uppercase mb-2">{day}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className={cn(
                    "h-12 rounded-xl flex items-center justify-center text-sm font-medium border",
                    i % 3 === 0 ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-zinc-50 border-zinc-100 text-zinc-400"
                  )}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-400 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-rose-500 rounded-full" /> Available slots
              </p>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-xl sticky top-24">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="text-3xl font-bold text-zinc-900">₹{friend.hourly_rate}</div>
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Per Hour</div>
                </div>
                <div className="text-xs text-zinc-400 text-right">
                  <span className="text-rose-600 font-bold">80%</span> to friend<br/>
                  <span className="text-zinc-600 font-bold">20%</span> platform fee
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Select Activity</label>
                  <select 
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option>Movie Partner</option>
                    <option>Event Companion</option>
                    <option>Travel Buddy</option>
                    <option>Study Partner</option>
                    <option>Fitness Partner</option>
                    <option>Wedding Companion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Duration</label>
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option>1 Hour</option>
                    <option>3 Hours</option>
                    <option>Half Day (6 Hours)</option>
                    <option>Full Day (12 Hours)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 mb-4"
              >
                Book Now
              </button>
              
              <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                By clicking "Book Now", you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/safety" className="underline">Safety Policy</Link>.
              </p>

              <div className="mt-8 pt-8 border-t border-zinc-100">
                <div className="flex items-center gap-3 text-zinc-600 text-sm">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  Secure Payment Gateway
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isBookingSuccess && setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[40px] p-8 md:p-12 max-w-lg w-full shadow-2xl overflow-hidden"
            >
              {isBookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-rose-600 w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-zinc-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-zinc-600">Your request has been sent to {friend.name}.</p>
                </div>
              ) : isBookingLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Processing...</h3>
                  <p className="text-zinc-600">Securing your companion for {selectedActivity}.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-3xl font-bold text-zinc-900">Confirm Booking</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-50 rounded-full transition-colors">
                      <X className="w-6 h-6 text-zinc-400" />
                    </button>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center py-4 border-b border-zinc-100">
                      <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Friend</span>
                      <span className="text-zinc-900 font-bold">{friend.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-100">
                      <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Activity</span>
                      <span className="text-zinc-900 font-bold">{selectedActivity}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-100">
                      <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Duration</span>
                      <span className="text-zinc-900 font-bold">{selectedDuration}</span>
                    </div>
                    <div className="flex justify-between items-center py-6 bg-rose-50 px-6 rounded-2xl">
                      <span className="text-rose-700 text-sm font-bold uppercase tracking-widest">Total Cost</span>
                      <span className="text-rose-700 text-2xl font-bold">₹{totalCost}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleConfirmBooking}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                    >
                      Confirm & Pay
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-4 bg-white text-zinc-400 font-bold text-lg hover:text-zinc-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <ChatWidget 
            friend={friend} 
            onClose={() => setIsChatOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const HowItWorksPage = () => (
  <div className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20">
        <h1 className="text-5xl font-bold text-zinc-900 mb-6">How FriendlyTime Works</h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto">Connecting you with verified social companions in four simple steps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {[
          { step: "01", title: "Sign Up", desc: "Create your profile with mobile OTP and Aadhaar/ID verification for a safe community." },
          { step: "02", title: "Choose Activity", desc: "Select from various activities like movies, events, travel, or fitness companionship." },
          { step: "03", title: "Select Friend", desc: "Browse verified profiles, check ratings, and choose a friend that matches your interests." },
          { step: "04", title: "Secure Booking", desc: "Book for your preferred duration and pay securely through our platform." }
        ].map((item, i) => (
          <div key={i} className="relative">
            <div className="text-8xl font-serif italic text-zinc-50 absolute -top-10 -left-4 z-0">{item.step}</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">{item.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-32 bg-zinc-900 rounded-[48px] p-12 md:p-20 text-center text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border border-white rounded-full" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">Ready to find your next companion?</h2>
        <Link to="/browse" className="inline-flex items-center gap-2 px-10 py-5 bg-rose-600 text-white rounded-2xl font-bold text-xl hover:bg-rose-700 transition-all relative z-10">
          Get Started Now <ArrowRight />
        </Link>
      </div>
    </div>
  </div>
);

const SafetyPage = () => (
  <div className="py-24 bg-zinc-50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[48px] p-12 md:p-20 border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-rose-600 w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900">Safety & Legal Policy</h1>
        </div>

        <div className="prose prose-zinc max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Strict No-Physical Intimacy Policy</h2>
            <p className="text-zinc-600 leading-relaxed">
              FriendlyTime is a platform for **social companionship only**. We strictly prohibit any form of physical intimacy, sexual services, or escort-like behavior. Our mission is to combat loneliness through platonic, safe, and legal social interactions.
            </p>
          </section>

          <section className="bg-amber-50 p-8 rounded-3xl border border-amber-100">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Legal Disclaimer
            </h2>
            <p className="text-amber-800 text-sm leading-relaxed">
              This platform provides social companionship services only and does not promote escorting, dating for money, or any illegal activity under Indian law (including the Immoral Traffic (Prevention) Act). Any user found violating these terms will be permanently banned and their details may be shared with law enforcement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Verification Process</h2>
            <ul className="space-y-4 text-zinc-600">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                <span>**ID Verification:** All "Friends" must provide a valid government ID (Aadhaar/PAN) which is verified by our team.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                <span>**Mobile OTP:** Mandatory mobile number verification for all users.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                <span>**Review System:** Continuous monitoring through user ratings and reviews.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Emergency Contact System</h2>
            <p className="text-zinc-600 leading-relaxed">
              Our app includes a "Safety Button" during active bookings that allows you to instantly share your live location with emergency contacts or alert our 24/7 safety team.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/friend/:id" element={<FriendProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
