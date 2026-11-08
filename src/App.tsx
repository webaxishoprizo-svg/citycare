import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Baby,
  BadgeCheck,
  Calendar,
  Check,
  Clock3,
  HeartPulse,
  Hospital,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Microscope,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import hospitalImage from './assets/hospital.png';
import { erpApi, ErpApiError, type ClinicInfo, type ApiDoctor, type ApiSlot, type ApiAppointment } from './services/erpApi';

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  department: string;
  department_id?: string;
  experience: string;
  qualification: string;
  image: string;
  availability: string;
  fee: string;
};

export type Department = {
  id?: string;
  name: string;
  description: string;
  icon: typeof HeartPulse;
  tint: string;
  count: string;
};

const consultationImage = 'https://images.pexels.com/photos/39192386/pexels-photo-39192386.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

// Initial fallback data for instant loading
const fallbackDoctors: Doctor[] = [
  { id: 'doc-1001', name: 'Dr. Aisha Rahman', specialty: 'General Physician', department: 'General Medicine', experience: '12+ Years Experience', qualification: 'MBBS, MD (Internal Medicine)', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80', availability: 'Available Today', fee: 'AED 250' },
  { id: 'doc-1003', name: 'Dr. Rohan Menon', specialty: 'Cardiologist', department: 'Cardiology', experience: '15+ Years Experience', qualification: 'MBBS, MD, DM (Cardiology)', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80', availability: 'Available Today', fee: 'AED 450' },
  { id: 'doc-1005', name: 'Dr. Neha Pillai', specialty: 'Dermatologist', department: 'Dermatology', experience: '9+ Years Experience', qualification: 'MBBS, MD (DVL)', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80', availability: 'Available Today', fee: 'AED 300' },
  { id: 'doc-1007', name: 'Dr. Arjun Nair', specialty: 'Orthopaedic Surgeon', department: 'Orthopaedics', experience: '14+ Years Experience', qualification: 'MBBS, MS (Ortho)', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80', availability: 'Available Tomorrow', fee: 'AED 350' },
  { id: 'doc-1009', name: 'Dr. Meera Krishnan', specialty: 'Paediatrician', department: 'Paediatrics', experience: '11+ Years Experience', qualification: 'MBBS, MD (Paediatrics)', image: 'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=400&auto=format&fit=crop&q=80', availability: 'Available Today', fee: 'AED 280' },
  { id: 'doc-1011', name: 'Dr. Anjali Varma', specialty: 'Dental Surgeon', department: 'Dentistry', experience: '8+ Years Experience', qualification: 'BDS, MDS (Conservative)', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&auto=format&fit=crop&q=80', availability: 'Available Tomorrow', fee: 'AED 250' },
];

const fallbackDepartments: Department[] = [
  { name: 'General Medicine', description: 'Complete medical care for common and chronic conditions.', icon: Stethoscope, tint: 'blue', count: '2 specialists' },
  { name: 'Cardiology', description: 'Advanced heart and vascular care, close to home.', icon: HeartPulse, tint: 'rose', count: '2 specialists' },
  { name: 'Dermatology', description: 'Healthy skin, hair and nails with a personal approach.', icon: Sparkles, tint: 'peach', count: '2 specialists' },
  { name: 'Orthopaedics', description: 'Bone, joint and spine care for an active life.', icon: Activity, tint: 'lilac', count: '2 specialists' },
  { name: 'Paediatrics', description: 'Thoughtful healthcare for children at every age.', icon: Baby, tint: 'yellow', count: '2 specialists' },
  { name: 'Dentistry', description: 'Complete dental care for confident, healthy smiles.', icon: Zap, tint: 'sky', count: '2 specialists' },
];

const fallbackClinic: ClinicInfo = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'CityCare Hospital',
  logo_url: null,
  address: 'Sheikh Zayed Road, Dubai Healthcare City, UAE',
  phone: '+971 4 400 1000',
  email: 'care@citycarehospital.com',
  timezone: 'Asia/Dubai',
  opening_time: '09:00',
  closing_time: '18:00',
  active_doctors_count: 12,
  active_departments_count: 6,
};

function getDepartmentMeta(name: string): { icon: typeof HeartPulse; tint: string } {
  const lower = name.toLowerCase();
  if (lower.includes('cardio')) return { icon: HeartPulse, tint: 'rose' };
  if (lower.includes('derma') || lower.includes('skin')) return { icon: Sparkles, tint: 'peach' };
  if (lower.includes('ortho') || lower.includes('bone')) return { icon: Activity, tint: 'lilac' };
  if (lower.includes('paed') || lower.includes('child')) return { icon: Baby, tint: 'yellow' };
  if (lower.includes('dent')) return { icon: Zap, tint: 'sky' };
  if (lower.includes('ent') || lower.includes('throat')) return { icon: Microscope, tint: 'mint' };
  return { icon: Stethoscope, tint: 'blue' };
}

// Global Clinic Context
interface ClinicContextType {
  clinic: ClinicInfo;
  doctors: Doctor[];
  departments: Department[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType>({
  clinic: fallbackClinic,
  doctors: fallbackDoctors,
  departments: fallbackDepartments,
  loading: false,
  refresh: async () => {},
});

const useClinic = () => useContext(ClinicContext);

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatSlotTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

function getBookingDays() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 864e5);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // Clinic closed Sunday
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${dy}`;
    const weekday = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const sub = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    days.push({ label: weekday, sub, dateStr, fullLabel: `${weekday}, ${sub}` });
  }
  return days;
}

function Logo() {
  const { clinic } = useClinic();
  const nameParts = (clinic.name || 'CityCare Hospital').split(' ');
  const mainName = nameParts.slice(0, -1).join(' ') || nameParts[0];
  const subName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Hospital';

  return (
    <button className="logo" onClick={() => navigate('/')} aria-label={`${clinic.name} home`}>
      <span className="logo-mark"><span /><span /><span /><span /></span>
      <span>{mainName}<small>{subName}</small></span>
    </button>
  );
}

function Header({ onChat }: { onChat: () => void }) {
  const { clinic } = useClinic();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [['About', '/about'], ['Doctors', '/doctors'], ['Departments', '/departments'], ['Services', '/services'], ['Contact', '/contact']];
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav">
          {links.map(([label, path]) => (
            <button key={path} onClick={() => navigate(path)}>{label}</button>
          ))}
        </nav>
        <div className="header-actions">
          <a className="phone-link" href={`tel:${clinic.phone?.replace(/\s+/g, '') || '+97144001000'}`}>
            <Phone size={15} /> {clinic.phone || '+971 4 400 1000'}
          </a>
          <button className="button button-primary header-book" onClick={() => navigate('/appointments/book')}>
            Book Appointment
          </button>
          <button className="icon-button menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="mobile-menu">
          {links.map(([label, path]) => (
            <button key={path} onClick={() => { setMobileOpen(false); navigate(path); }}>{label}</button>
          ))}
          <button onClick={() => { setMobileOpen(false); navigate('/appointments/book'); }}>
            Book an Appointment <ArrowRight size={16} />
          </button>
          <button onClick={() => { setMobileOpen(false); onChat(); }}>
            Chat with iRIS <MessageCircle size={16} />
          </button>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { clinic } = useClinic();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-copy">Thoughtful healthcare, made easier.<br />Here for your whole family.</p>
          <div className="socials"><span>in</span><span>f</span><span>◎</span></div>
        </div>
        <div>
          <h4>Explore</h4>
          <button onClick={() => navigate('/about')}>About us</button>
          <button onClick={() => navigate('/doctors')}>Our doctors</button>
          <button onClick={() => navigate('/departments')}>Departments</button>
          <button onClick={() => navigate('/services')}>Services</button>
        </div>
        <div>
          <h4>Patient care</h4>
          <button onClick={() => navigate('/appointments/book')}>Book an appointment</button>
          <button onClick={() => navigate('/contact')}>Contact the clinic</button>
          <button onClick={() => navigate('/doctors')}>Find a doctor</button>
          <button onClick={() => navigate('/appointments/book')}>Check availability</button>
        </div>
        <div>
          <h4>Visit us</h4>
          <p><MapPin size={15} /> {clinic.address || 'Sheikh Zayed Road, Dubai Healthcare City, UAE'}</p>
          <p><Phone size={15} /> {clinic.phone || '+971 4 400 1000'}</p>
          <p><Mail size={15} /> {clinic.email || 'care@citycarehospital.com'}</p>
          <p><Clock3 size={15} /> Open Mon – Sat · {clinic.opening_time || '09:00'} – {clinic.closing_time || '18:00'}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 {clinic.name || 'CityCare Hospital'}. Powered by Central ERP Integration.</span>
        <span>Privacy · Terms · Accessibility</span>
      </div>
    </footer>
  );
}

type ChatMessage = { from: 'bot' | 'user'; text: string; quickReplies?: { label: string; action: () => void }[] };

function IrisLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="16" cy="9" rx="2.8" ry="7" />
        <ellipse cx="16" cy="23" rx="2.8" ry="7" />
        <ellipse cx="9" cy="16" rx="7" ry="2.8" />
        <ellipse cx="23" cy="16" rx="7" ry="2.8" />
        <ellipse cx="11" cy="11" rx="1.4" ry="5" transform="rotate(45 11 11)" opacity="0.55" />
        <ellipse cx="21" cy="11" rx="1.4" ry="5" transform="rotate(-45 21 11)" opacity="0.55" />
        <ellipse cx="11" cy="21" rx="1.4" ry="5" transform="rotate(-45 11 21)" opacity="0.55" />
        <ellipse cx="21" cy="21" rx="1.4" ry="5" transform="rotate(45 21 21)" opacity="0.55" />
      </g>
    </svg>
  );
}

function ChatWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clinic } = useClinic();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamically fetch live AI greeting from Iris AI when chat is opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setIsTyping(true);
      erpApi
        .chat('init')
        .then((res) => {
          setMessages([
            {
              from: 'bot',
              text: res.reply,
              quickReplies: res.quickReplies?.map((qr) => ({
                label: qr.label,
                action: () => qr.actionUrl && navigate(qr.actionUrl),
              })),
            },
          ]);
        })
        .catch(() => {
          setMessages([
            {
              from: 'bot',
              text: 'Hello! I am iRIS, your CityCare Hospital Patient Assistant. How can I help you today?',
              quickReplies: [
                { label: 'Book an appointment', action: () => navigate('/appointments/book') },
                { label: 'Find a doctor', action: () => navigate('/doctors') },
                { label: 'Explore departments', action: () => navigate('/departments') },
              ],
            },
          ]);
        })
        .finally(() => setIsTyping(false));
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const send = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { from: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await erpApi.chat(trimmed);
      const botMsg: ChatMessage = {
        from: 'bot',
        text: response.reply,
        quickReplies: response.quickReplies?.map(qr => ({
          label: qr.label,
          action: () => {
            if (qr.actionUrl) {
              navigate(qr.actionUrl);
            }
          },
        })),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          from: 'bot',
          text: `I'm having trouble connecting to the CityCare AI assistant gateway right now. You can book an appointment or browse our doctors directly.`,
          quickReplies: [
            { label: 'Book an appointment', action: () => navigate('/appointments/book') },
            { label: 'Find a doctor', action: () => navigate('/doctors') },
          ],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!open) return null;
  return (
    <div className="chat-overlay" role="dialog" aria-label="iRIS AI assistant">
      <div className="chat-panel">
        <div className="chat-head">
          <div className="chat-head-glow" />
          <div className="chat-head-info">
            <div className="bot-avatar"><IrisLogo size={22} /></div>
            <div className="chat-head-text">
              <strong>iRIS</strong>
              <small>{clinic.name} AI patient assistant</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close assistant"><X size={18} /></button>
        </div>
        <div className="chat-body" ref={scrollRef}>
          {messages.map((message, index) => (
            <div key={index}>
              <div className={`chat-message ${message.from}`}>{message.text}</div>
              {message.quickReplies && (
                <div className="quick-replies">
                  {message.quickReplies.map(qr => (
                    <button key={qr.label} onClick={qr.action}>{qr.label}<ArrowRight size={11} /></button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isTyping && <div className="chat-message bot typing"><span /><span /><span /></div>}
        </div>
        <form className="chat-input" onSubmit={e => { e.preventDefault(); send(); }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." aria-label="Message iRIS" autoComplete="off" />
          <button type="submit" aria-label="Send message"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}

function AssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="assistant-fab" onClick={onClick}>
      <span className="fab-icon"><IrisLogo size={20} /></span>
      <span>Ask iRIS</span>
    </button>
  );
}

function SectionIntro({ eyebrow, title, text, action }: { eyebrow: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="section-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

function DoctorCard({ doctor, compact = false }: { doctor: Doctor; compact?: boolean }) {
  return (
    <article className={`doctor-card ${compact ? 'compact' : ''}`}>
      <div className="doctor-photo">
        <img src={doctor.image} alt={doctor.name} />
        <span className="heart">♡</span>
      </div>
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <p className="specialty">{doctor.specialty}</p>
        <p className="experience">{doctor.experience}</p>
        <span className={`availability ${doctor.availability.includes('Today') ? 'today' : 'tomorrow'}`}>
          <span /> {doctor.availability} · {doctor.fee}
        </span>
        {!compact && (
          <div className="card-actions">
            <button className="text-button" onClick={() => navigate(`/doctors/${doctor.id}`)}>
              View profile <ArrowRight size={14} />
            </button>
            <button className="small-book" onClick={() => navigate(`/appointments/book?doctor=${doctor.id}`)}>
              Book
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  const Icon = department.icon;
  return (
    <button className={`department-card ${department.tint}`} onClick={() => navigate(`/appointments/book?dept=${encodeURIComponent(department.name)}`)}>
      <span className="dept-icon"><Icon size={25} /></span>
      <strong>{department.name}</strong>
      <span>{department.description}</span>
      <small>{department.count} <ArrowRight size={13} /></small>
    </button>
  );
}

function Home({ onChat }: { onChat: () => void }) {
  const { clinic, doctors, departments } = useClinic();

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="eyebrow">Multispeciality care, made personal</span>
            <h1>Better care for a <em>healthier</em> you.</h1>
            <p className="hero-sub">Expert doctors, modern clinic management and real-time appointment booking — seamlessly connected.</p>
            <div className="hero-buttons">
              <button className="button button-primary" onClick={() => navigate('/appointments/book')}>
                <Calendar size={17} /> Book an appointment
              </button>
              <button className="button button-outline" onClick={onChat}>
                <MessageCircle size={17} /> Chat with iRIS
              </button>
            </div>
            <div className="trust-row">
              <span><BadgeCheck size={18} /> {doctors.length}+ verified doctors</span>
              <span><Calendar size={18} /> Live slot booking</span>
              <span><ShieldCheck size={18} /> Central ERP integrated</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src={hospitalImage} alt={`${clinic.name} facility`} />
            <div className="hero-overlay">
              <div className="hospital-badge">
                <span className="mini-cross">+</span>
                <strong>{clinic.name}<small>Live Clinic ERP</small></strong>
              </div>
              <span>Care that feels closer</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-inner">
          <div><strong>{departments.length}<span>+</span></strong><span>Specialities</span></div>
          <div><strong>{doctors.length}<span>+</span></strong><span>Expert doctors</span></div>
          <div><strong>10K<span>+</span></strong><span>Happy patients</span></div>
          <div><strong>Live</strong><span>Real-time booking</span></div>
        </div>
      </section>

      <section className="section container">
        <SectionIntro
          eyebrow="Care, your way"
          title="Departments we offer"
          text="From everyday health to specialised consultations, our departments provide comprehensive outpatient care."
          action={<button className="link-button" onClick={() => navigate('/departments')}>View all departments <ArrowRight size={15} /></button>}
        />
        <div className="department-grid home-departments">
          {departments.slice(0, 6).map(d => <DepartmentCard key={d.name} department={d} />)}
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <SectionIntro
            eyebrow="People you can trust"
            title="Meet our expert doctors"
            text="Experienced specialists available for outpatient consultations. Schedules and consultation fees are synced directly from our ERP."
            action={<button className="link-button" onClick={() => navigate('/doctors')}>View all doctors <ArrowRight size={15} /></button>}
          />
          <div className="doctor-grid">
            {doctors.slice(0, 4).map(doctor => <DoctorCard key={doctor.id} doctor={doctor} compact />)}
            <div className="doctor-cta">
              <div className="bot-orb"><IrisLogo size={30} /></div>
              <h3>Need help choosing?</h3>
              <p>iRIS can guide you to the right specialist in a few simple questions.</p>
              <button className="button button-white" onClick={onChat}>Start a chat <ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="ai-promo container">
        <div className="ai-copy">
          <span className="eyebrow light">Your care companion</span>
          <h2>Meet iRIS, your AI patient assistant.</h2>
          <p>Find a doctor, check availability and book your clinic visit with calm, helpful guidance — whenever you need it.</p>
          <ul>
            <li><Check size={16} /> Find the right specialist for your needs</li>
            <li><Check size={16} /> Check live availability from the Clinic ERP</li>
            <li><Check size={16} /> Instant confirmation with booking reference</li>
          </ul>
          <button className="button button-white" onClick={onChat}>Chat with iRIS <ArrowRight size={15} /></button>
        </div>
        <div className="ai-chat-preview">
          <div className="preview-top">
            <span className="bot-avatar"><IrisLogo size={18} /></span>
            <strong>iRIS</strong>
            <span className="online-label">Online</span>
          </div>
          <div className="preview-bubble">Hi there! How can I help you with your clinic visit today?</div>
          <div className="preview-pills">
            <span>Book an appointment</span>
            <span>Find a doctor</span>
          </div>
          <div className="preview-input">Type your message... <Send size={13} /></div>
        </div>
      </section>

      <section className="section container facilities">
        <SectionIntro eyebrow="More than medicine" title="A better hospital experience" text="Everything we do is designed around making your care feel clear, comfortable and connected." />
        <div className="facility-grid">
          <div>
            <span><Hospital size={21} /></span>
            <strong>Modern facilities</strong>
            <p>Clean, well-equipped clinic rooms designed for comfortable outpatient care.</p>
          </div>
          <div>
            <span><ShieldCheck size={21} /></span>
            <strong>Trusted & safe</strong>
            <p>Direct ERP scheduling prevents double-bookings and saves your time.</p>
          </div>
          <div>
            <span><UsersRound size={21} /></span>
            <strong>Convenient access</strong>
            <p>Easy online booking, instant confirmation and support when you arrive.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function About() {
  const { clinic } = useClinic();
  return (
    <main>
      <PageHero eyebrow="Who we are" title="Care that sees the whole person." text={`${clinic.name} brings thoughtful physicians, modern medicine and a warmer patient experience together.`} />
      <section className="section container split-section">
        <div className="split-image">
          <img src={consultationImage} alt="Doctor consulting with patient" />
          <span className="image-note"><strong>10K+</strong><small>patients cared for</small></span>
        </div>
        <div className="split-copy">
          <span className="eyebrow">Our approach</span>
          <h2>Healthcare should feel human.</h2>
          <p>We believe a clinic visit should be clear, respectful and built around you. Our physicians take time to listen, explain your options and coordinate details so you can focus on getting well.</p>
          <p>From your first conversation to follow-up, our team connects specialist expertise with genuine kindness.</p>
          <div className="values">
            <div><HeartPulse size={19} /><strong>Compassion first</strong><span>We listen before we act.</span></div>
            <div><BadgeCheck size={19} /><strong>Clinical excellence</strong><span>Care grounded in verified expertise.</span></div>
            <div><UsersRound size={19} /><strong>Better together</strong><span>Teams that work as one.</span></div>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <SectionIntro eyebrow="Our promise" title="Good care, made easier." text="A few principles guide every interaction at our clinic." />
          <div className="promise-grid">
            <div><span>01</span><h3>Listen closely</h3><p>We make room for your questions, context and recovery goals.</p></div>
            <div><span>02</span><h3>Explain clearly</h3><p>We turn complex choices into confident next steps with no confusion.</p></div>
            <div><span>03</span><h3>Stay connected</h3><p>Your care continues with proper follow-up and digital scheduling.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DoctorsPage() {
  const { doctors, departments } = useClinic();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [availability, setAvailability] = useState('Any availability');

  const filtered = doctors.filter(d =>
    (d.name + d.specialty + d.qualification).toLowerCase().includes(query.toLowerCase()) &&
    (department === 'All departments' || d.department === department) &&
    (availability === 'Any availability' || d.availability === availability)
  );

  return (
    <main>
      <PageHero eyebrow="Our specialists" title="Find the right doctor for you." text="Meet experienced physicians across our departments. Filter by specialty, fee, or availability to book your visit." />
      <section className="container directory">
        <div className="directory-tools">
          <div className="search-field">
            <Search size={17} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, qualification or speciality..." />
          </div>
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            <option>All departments</option>
            {departments.map(d => <option key={d.name}>{d.name}</option>)}
          </select>
          <select value={availability} onChange={e => setAvailability(e.target.value)}>
            <option>Any availability</option>
            <option>Available Today</option>
            <option>Available Tomorrow</option>
          </select>
        </div>
        <div className="directory-meta">
          <span>{filtered.length} doctors found</span>
          <span>Live data from Clinic ERP</span>
        </div>
        {filtered.length ? (
          <div className="directory-grid">
            {filtered.map(d => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={25} />
            <h3>No doctors found</h3>
            <p>Try adjusting your search criteria or select another department.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function DoctorProfile({ id }: { id: string }) {
  const { doctors } = useClinic();
  const doctor = doctors.find(d => d.id === id || d.id.toLowerCase() === id.toLowerCase()) || doctors[0];
  const bookingDays = useMemo(() => getBookingDays(), []);
  const [selectedDay, setSelectedDay] = useState(bookingDays[0]);
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!doctor || !selectedDay) return;
    let cancelled = false;
    setLoadingSlots(true);
    erpApi.getSlots(doctor.id, selectedDay.dateStr)
      .then(res => {
        if (!cancelled) {
          setSlots(res || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [doctor, selectedDay]);

  if (!doctor) return null;

  return (
    <main>
      <div className="container breadcrumbs">
        Home <ArrowRight size={13} /> Doctors <ArrowRight size={13} /> {doctor.name}
      </div>
      <section className="container profile-layout">
        <div className="profile-main">
          <div className="profile-top">
            <img src={doctor.image} alt={doctor.name} />
            <div>
              <span className="eyebrow">{doctor.department}</span>
              <h1>{doctor.name}</h1>
              <p className="profile-specialty">{doctor.specialty}</p>
              <span className="availability today"><span /> {doctor.availability} · Fee: {doctor.fee}</span>
            </div>
          </div>
          <div className="profile-content">
            <h2>About {doctor.name}</h2>
            <p>{doctor.name} is a qualified {doctor.specialty.toLowerCase()} at our clinic providing attentive, personalised consultations.</p>
            <div className="profile-facts">
              <div><span>Qualifications</span><strong>{doctor.qualification}</strong></div>
              <div><span>Experience</span><strong>{doctor.experience}</strong></div>
              <div><span>Consultation fee</span><strong>{doctor.fee}</strong></div>
            </div>
            <h2>Consultation hours</h2>
            <div className="hours">
              <span>Mon – Fri</span><strong>09:00 AM – 05:00 PM</strong>
              <span>Saturday</span><strong>09:00 AM – 01:00 PM</strong>
            </div>
          </div>
        </div>

        <aside className="booking-card">
          <span className="eyebrow">Book a visit</span>
          <h2>Choose a time that works for you.</h2>
          <p>Available slots fetched directly from ERP.</p>
          <div className="date-row">
            {bookingDays.slice(0, 3).map(day => (
              <button
                key={day.dateStr}
                className={selectedDay.dateStr === day.dateStr ? 'selected' : ''}
                onClick={() => setSelectedDay(day)}
              >
                <strong>{day.label}</strong>
                <span>{day.sub}</span>
              </button>
            ))}
          </div>

          <div className="slot-grid">
            {loadingSlots ? (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '15px 0', color: '#65738b' }}>
                <Loader2 size={18} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} /> Checking slots...
              </div>
            ) : slots.filter(s => s.status === 'available').length > 0 ? (
              slots.filter(s => s.status === 'available').slice(0, 6).map(slot => (
                <button
                  key={slot.start_at}
                  onClick={() => navigate(`/appointments/book?doctor=${doctor.id}&slot=${encodeURIComponent(slot.start_at)}&date=${encodeURIComponent(selectedDay.dateStr)}`)}
                >
                  {formatSlotTime(slot.start_at)}
                </button>
              ))
            ) : (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '12px 0', color: '#7b899d', fontSize: '12px' }}>
                No open slots for {selectedDay.label}. Try another date.
              </div>
            )}
          </div>

          <button className="button button-primary full" onClick={() => navigate(`/appointments/book?doctor=${doctor.id}&date=${encodeURIComponent(selectedDay.dateStr)}`)}>
            Book appointment <ArrowRight size={15} />
          </button>
          <small className="secure-note"><ShieldCheck size={14} /> Real-time confirmation · Direct ERP save</small>
        </aside>
      </section>
    </main>
  );
}

function DepartmentsPage() {
  const { departments } = useClinic();
  return (
    <main>
      <PageHero eyebrow="Specialist care" title="The right care, all in one place." text="Explore our active departments and connect with specialists experienced in treating your condition." />
      <section className="section container department-list">
        <div className="large-dept">
          <div>
            <span className="dept-icon blue"><Stethoscope size={29} /></span>
            <span className="eyebrow">Start here</span>
            <h2>General Medicine</h2>
            <p>Primary medical care for common illnesses, fever, preventive health checks and chronic condition monitoring.</p>
            <button className="text-button" onClick={() => navigate('/appointments/book?dept=General%20Medicine')}>
              Book a consultation <ArrowRight size={14} />
            </button>
          </div>
          <img src={consultationImage} alt="Doctor talking with patient" />
        </div>
        <div className="department-grid all-departments">
          {departments.map(d => <DepartmentCard key={d.name} department={d} />)}
        </div>
      </section>
    </main>
  );
}

function ServicesPage() {
  const services = [
    { icon: Stethoscope, title: 'Specialist consultations', text: 'Careful examinations with verified consultants across General Medicine, Cardiology, Dermatology, and more.' },
    { icon: Calendar, title: 'Real-time appointment booking', text: 'View live doctor availability and reserve your slot instantly through our central ERP.' },
    { icon: ShieldCheck, title: 'Preventive health checks', text: 'Practical check-ups, lifestyle advice and diagnostic reviews to safeguard your wellbeing.' },
    { icon: Syringe, title: 'Vaccinations & wellness', text: 'Routine adult and child immunisations with complete electronic record tracking.' },
    { icon: HeartPulse, title: 'Chronic condition support', text: 'Personalised treatment plans for hypertension, diabetes, asthma and cardiac follow-ups.' },
    { icon: Hospital, title: 'Modern clinic facilities', text: 'Calm, well-maintained examination rooms and diagnostic support for a seamless visit.' },
  ];

  return (
    <main>
      <PageHero eyebrow="How we help" title="Simple access to better care." text="A focused range of outpatient clinical services designed for prompt care, clear explanations and genuine kindness." />
      <section className="section container services-grid">
        {services.map(({ icon: Icon, title, text }) => (
          <div className="service-card" key={title}>
            <span className="service-icon"><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="text-button" onClick={() => navigate('/appointments/book')}>
              Get started <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </section>
      <section className="container service-callout">
        <div>
          <span className="eyebrow">Not sure where to begin?</span>
          <h2>Let iRIS point you in the right direction.</h2>
          <p>Our AI assistant can help you pick the right specialty before booking.</p>
        </div>
        <button className="button button-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}>
          Ask iRIS <MessageCircle size={17} />
        </button>
      </section>
    </main>
  );
}

function ContactPage() {
  const { clinic } = useClinic();
  const [sent, setSent] = useState(false);

  return (
    <main>
      <PageHero eyebrow="We are here to help" title="Let’s talk about your care." text="Whether you have questions regarding doctor schedules, appointments or visit directions, our desk is ready." />
      <section className="section container contact-layout">
        <div>
          <div className="contact-details">
            <div>
              <span><MapPin size={19} /></span>
              <div>
                <strong>Visit {clinic.name}</strong>
                <p>{clinic.address || 'MG Road, Kochi, Kerala 682016'}</p>
              </div>
            </div>
            <div>
              <span><Phone size={19} /></span>
              <div>
                <strong>Call our front desk</strong>
                <p>{clinic.phone || '+971 4 400 1000'}<br />Mon – Sat, {clinic.opening_time} – {clinic.closing_time}</p>
              </div>
            </div>
            <div>
              <span><Mail size={19} /></span>
              <div>
                <strong>Email support</strong>
                <p>{clinic.email || 'care@citycarehospital.com'}<br />Front desk replies promptly.</p>
              </div>
            </div>
          </div>
          <div className="map-placeholder">
            <MapPin size={30} />
            <strong>{clinic.name}</strong>
            <span>{clinic.address}</span>
            <button onClick={() => navigate('/appointments/book')}>Book an appointment <ArrowRight size={14} /></button>
          </div>
        </div>
        <div className="contact-form-card">
          <span className="eyebrow">Send an enquiry</span>
          <h2>How can we help?</h2>
          {sent ? (
            <div className="success-state">
              <span><Check size={24} /></span>
              <h3>Thanks for reaching out.</h3>
              <p>Your message has been received by our clinic reception team.</p>
              <button className="text-button" onClick={() => setSent(false)}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); }}>
              <label>Your name<input required placeholder="Enter your name" /></label>
              <label>Email address<input required type="email" placeholder="you@example.com" /></label>
              <label>How can we help?<textarea required placeholder="Tell us about your question or requested doctor..." rows={4} /></label>
              <button className="button button-primary full" type="submit">Send enquiry <Send size={15} /></button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function BookingPage() {
  const { doctors, departments, clinic } = useClinic();
  const searchParams = new URLSearchParams(window.location.search);
  const initialDoctorId = searchParams.get('doctor');
  const initialDept = searchParams.get('dept');
  const initialSlot = searchParams.get('slot');
  const initialDateStr = searchParams.get('date');

  const bookingDays = useMemo(() => getBookingDays(), []);
  
  const [step, setStep] = useState(1);
  const [dept, setDept] = useState(initialDept || '');
  const [doctor, setDoctor] = useState(initialDoctorId || '');
  const [selectedDay, setSelectedDay] = useState(() => {
    if (initialDateStr) {
      const found = bookingDays.find(d => d.dateStr === initialDateStr);
      if (found) return found;
    }
    return bookingDays[0];
  });
  const [slot, setSlot] = useState(initialSlot || '');
  const [details, setDetails] = useState({ name: '', email: '', phone: '' });

  // Slots fetching state
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedAppt, setConfirmedAppt] = useState<ApiAppointment | null>(null);

  // Auto initialize doctor / dept from query param
  useEffect(() => {
    if (initialDoctorId && doctors.length) {
      const doc = doctors.find(d => d.id === initialDoctorId || d.id.toLowerCase() === initialDoctorId.toLowerCase());
      if (doc) {
        setDoctor(doc.id);
        setDept(doc.department);
        setStep(initialSlot ? 4 : 3);
      }
    } else if (initialDept && departments.length) {
      const matched = departments.find(d => d.name.toLowerCase() === initialDept.toLowerCase());
      if (matched) {
        setDept(matched.name);
        setStep(2);
      }
    }
  }, [initialDoctorId, initialDept, doctors, departments, initialSlot]);

  // When step 3 is reached or doctor/day changes, fetch available slots from ERP
  useEffect(() => {
    if (!doctor || !selectedDay) return;
    let isCancelled = false;
    setLoadingSlots(true);
    setBookingError(null);

    erpApi.getSlots(doctor, selectedDay.dateStr)
      .then(fetchedSlots => {
        if (!isCancelled) {
          setSlots(fetchedSlots || []);
          // If previous slot is not in the new slots or not available, reset it
          if (slot && !fetchedSlots?.some(s => s.start_at === slot && s.status === 'available')) {
            setSlot('');
          }
        }
      })
      .catch(err => {
        if (!isCancelled) {
          console.error('Failed to fetch slots from ERP:', err);
          setSlots([]);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingSlots(false);
      });

    return () => { isCancelled = true; };
  }, [doctor, selectedDay, slot]);

  const selectedDoctor = doctors.find(d => d.id === doctor);
  const availableDoctors = doctors.filter(d => !dept || d.department === dept);

  const canNext =
    (step === 1 && Boolean(dept)) ||
    (step === 2 && Boolean(doctor)) ||
    (step === 3 && Boolean(slot)) ||
    (step === 4 && Boolean(details.name.trim() && details.phone.trim()));

  const next = () => {
    if (!canNext) return;
    setBookingError(null);
    setStep(step + 1);
  };

  const handleConfirm = async () => {
    if (!doctor || !slot || !details.name || !details.phone) return;
    setSubmitting(true);
    setBookingError(null);

    try {
      const appt = await erpApi.bookAppointment({
        doctor_id: doctor,
        start_at: slot,
        patient_name: details.name.trim(),
        patient_email: details.email.trim() || undefined,
        patient_phone: details.phone.trim(),
        appointment_type: 'consultation',
        notes: `Booked online via ${clinic.name} patient portal`,
      });

      setConfirmedAppt(appt);
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      if (err instanceof ErpApiError && err.code === 'SLOT_ALREADY_BOOKED') {
        setBookingError('This time slot was just booked by another patient. Please choose a different slot.');
        setStep(3); // Send back to slot selection
      } else if (err instanceof Error) {
        setBookingError(err.message || 'Unable to complete your booking. Please verify your details and try again.');
      } else {
        setBookingError('Unable to complete your booking. Please verify your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedAppt) {
    return (
      <main>
        <div className="container confirmation">
          <div className="success-ring"><Check size={32} /></div>
          <span className="eyebrow">Appointment confirmed in ERP</span>
          <h1>You’re all set, {details.name.split(' ')[0] || 'there'}.</h1>
          <p>
            Your visit with <strong>{selectedDoctor?.name || 'our doctor'}</strong> is confirmed for{' '}
            <strong>{selectedDay.fullLabel} at {formatSlotTime(confirmedAppt.start_at)}</strong>.
            The appointment is saved directly in the {clinic.name} ERP schedule.
          </p>
          <div className="confirmation-id">
            Booking reference <strong>{confirmedAppt.code}</strong>
          </div>
          <div style={{ margin: '15px 0 25px', color: '#65738b', fontSize: '13px' }}>
            A confirmation record has been logged in the ERP dashboard. No advance payment required.
          </div>
          <button className="button button-primary" onClick={() => navigate('/')}>
            Back to Home <ArrowRight size={15} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container booking-page">
        <div className="booking-heading">
          <span className="eyebrow">Direct ERP Booking</span>
          <h1>Book an appointment.</h1>
          <p>Choose your department, physician, and real available slot from the clinic calendar.</p>
        </div>

        <div className="progress">
          {['Department', 'Doctor', 'Date & time', 'Your details', 'Confirm'].map((label, i) => (
            <div className={step > i ? 'active' : ''} key={label}>
              <span>{step > i + 1 ? <Check size={13} /> : i + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        {bookingError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <AlertCircle size={18} />
            <span>{bookingError}</span>
          </div>
        )}

        <div className="booking-layout">
          <div className="booking-form-card">
            {step === 1 && (
              <div className="form-step">
                <h2>What can we help with?</h2>
                <p>Select a clinical department to see available physicians.</p>
                <div className="choice-grid">
                  {departments.map(d => {
                    const Icon = d.icon;
                    return (
                      <button
                        className={dept === d.name ? 'selected' : ''}
                        key={d.name}
                        onClick={() => {
                          setDept(d.name);
                          setDoctor('');
                        }}
                      >
                        <Icon size={21} />
                        <strong>{d.name}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <h2>Choose your doctor</h2>
                <p>Physicians available for {dept || 'all departments'}.</p>
                <div className="doctor-choices">
                  {availableDoctors.map(d => (
                    <button
                      className={doctor === d.id ? 'selected' : ''}
                      key={d.id}
                      onClick={() => setDoctor(d.id)}
                    >
                      <img src={d.image} alt={d.name} />
                      <span>
                        <strong>{d.name}</strong>
                        <small>{d.specialty} · {d.experience} · {d.fee}</small>
                      </span>
                      <Check size={17} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <h2>Select date & available slot</h2>
                <p>Slots are queried in real time from {selectedDoctor?.name}’s schedule.</p>
                <div className="date-options">
                  {bookingDays.map(day => (
                    <button
                      key={day.dateStr}
                      className={selectedDay.dateStr === day.dateStr ? 'selected' : ''}
                      onClick={() => setSelectedDay(day)}
                    >
                      <strong>{day.label}</strong>
                      <span>{day.sub}</span>
                    </button>
                  ))}
                </div>

                <h3 className="subheading">Available appointment times ({selectedDay.fullLabel})</h3>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#65738b' }}>
                    <Loader2 size={24} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
                    Checking doctor availability in ERP...
                  </div>
                ) : slots.filter(s => s.status === 'available').length > 0 ? (
                  <div className="slot-grid large">
                    {slots
                      .filter(s => s.status === 'available')
                      .map(s => {
                        const timeLabel = formatSlotTime(s.start_at);
                        const isSelected = slot === s.start_at;
                        return (
                          <button
                            key={s.start_at}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => setSlot(s.start_at)}
                          >
                            {timeLabel}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                    No open consultation slots on this date. Doctor may be off duty or fully booked. Please pick another date above.
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="form-step">
                <h2>Tell us about yourself</h2>
                <p>We’ll register your appointment in the clinic ERP under these details.</p>
                <div className="details-fields">
                  <label>
                    Full name *
                    <input
                      required
                      value={details.name}
                      onChange={e => setDetails({ ...details, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </label>
                  <label>
                    Mobile number * (used for clinic lookup)
                    <input
                      required
                      value={details.phone}
                      onChange={e => setDetails({ ...details, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </label>
                  <label>
                    Email address (optional)
                    <input
                      type="email"
                      value={details.email}
                      onChange={e => setDetails({ ...details, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="form-step">
                <h2>Review your appointment</h2>
                <p>Please double check your visit summary before submitting to the clinic ERP.</p>
                <div className="review">
                  <span>Department<strong>{dept}</strong></span>
                  <span>Doctor<strong>{selectedDoctor?.name} ({selectedDoctor?.specialty})</strong></span>
                  <span>Consultation Fee<strong>{selectedDoctor?.fee}</strong></span>
                  <span>Date & time<strong>{selectedDay.fullLabel} at {formatSlotTime(slot)}</strong></span>
                  <span>Patient Name<strong>{details.name}</strong></span>
                  <span>Phone Number<strong>{details.phone}</strong></span>
                </div>
                <p className="secure-note">
                  <ShieldCheck size={15} /> Your booking will be validated against double bookings and saved immediately in the ERP.
                </p>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <button className="button button-ghost" onClick={() => setStep(step - 1)} disabled={submitting}>
                  Back
                </button>
              )}
              {step < 5 ? (
                <button className="button button-primary" disabled={!canNext} onClick={next}>
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button className="button button-primary" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving to ERP...
                    </>
                  ) : (
                    <>
                      Confirm appointment <Check size={15} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <aside className="booking-summary">
            <span className="eyebrow">Your visit</span>
            <h3>{selectedDoctor?.name || clinic.name}</h3>
            <p>{selectedDoctor?.specialty || 'Select your department and physician to see visit details.'}</p>
            <div className="summary-line">
              <Calendar size={16} />
              {selectedDay ? selectedDay.fullLabel : 'Date to be selected'}
            </div>
            <div className="summary-line">
              <Clock3 size={16} />
              {slot ? formatSlotTime(slot) : 'Time slot to be selected'}
            </div>
            <div className="summary-line">
              <MapPin size={16} />
              {clinic.address}
            </div>
            <div className="demo-label">
              <span style={{ background: '#22c55e' }} /> Connected to Live ERP API
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [chatOpen, setChatOpen] = useState(false);

  // Global clinic data state
  const [clinic, setClinic] = useState<ClinicInfo>(fallbackClinic);
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors);
  const [departments, setDepartments] = useState<Department[]>(fallbackDepartments);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic data from ERP on mount
  const loadData = async () => {
    try {
      const [clinicRes, deptsRes, docsRes] = await Promise.allSettled([
        erpApi.getClinicInfo(),
        erpApi.getDepartments(),
        erpApi.getDoctors(),
      ]);

      if (clinicRes.status === 'fulfilled' && clinicRes.value) {
        setClinic(clinicRes.value);
      }

      let activeDocs: ApiDoctor[] = [];
      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
        activeDocs = docsRes.value;
        const mapped: Doctor[] = activeDocs.map(d => ({
          id: d.id,
          name: d.full_name,
          specialty: d.speciality,
          department: d.department_name || 'General Medicine',
          department_id: d.department_id,
          experience: `${d.experience_years}+ Years Experience`,
          qualification: d.qualifications,
          image: d.photo_url || fallbackDoctors[0].image,
          availability: 'Available Today',
          fee: `AED ${d.consultation_fee}`,
        }));
        if (mapped.length > 0) {
          setDoctors(mapped);
        }
      }

      if (deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value)) {
        const mappedDepts: Department[] = deptsRes.value.map(d => {
          const meta = getDepartmentMeta(d.name);
          const count = activeDocs.filter(doc => doc.department_id === d.id).length;
          return {
            id: d.id,
            name: d.name,
            description: d.description || 'Comprehensive clinical care.',
            icon: meta.icon,
            tint: meta.tint,
            count: `${count} specialist${count === 1 ? '' : 's'}`,
          };
        });
        if (mappedDepts.length > 0) {
          setDepartments(mappedDepts);
        }
      }
    } catch (e) {
      console.warn('Using baseline clinic cache:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onPop = () => setPath(window.location.pathname);
    const onChat = () => setChatOpen(true);
    window.addEventListener('popstate', onPop);
    window.addEventListener('open-chat', onChat);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('open-chat', onChat);
    };
  }, []);

  const page = useMemo(() => {
    if (path === '/') return <Home onChat={() => setChatOpen(true)} />;
    if (path === '/about') return <About />;
    if (path === '/doctors') return <DoctorsPage />;
    if (path.startsWith('/doctors/')) return <DoctorProfile id={path.split('/')[2]} />;
    if (path === '/departments') return <DepartmentsPage />;
    if (path === '/services') return <ServicesPage />;
    if (path === '/contact') return <ContactPage />;
    if (path.startsWith('/appointments/book')) return <BookingPage />;
    return <Home onChat={() => setChatOpen(true)} />;
  }, [path]);

  const contextValue = useMemo(() => ({
    clinic,
    doctors,
    departments,
    loading,
    refresh: loadData,
  }), [clinic, doctors, departments, loading]);

  return (
    <ClinicContext.Provider value={contextValue}>
      <div className="app-shell">
        <Header onChat={() => setChatOpen(true)} />
        {page}
        <Footer />
        <AssistantButton onClick={() => setChatOpen(true)} />
        <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </ClinicContext.Provider>
  );
}

export default App;
