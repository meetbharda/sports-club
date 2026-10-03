import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import AuthModal from './components/common/AuthModal';
import AccessDenied from './components/common/AccessDenied';

// Public Pages
import Home from './pages/public/Home';
import Sports from './pages/public/Sports';
import Facilities from './pages/public/Facilities';
import Membership from './pages/public/Membership';
import ShopCatalog from './pages/public/ShopCatalog';
import BarMenu from './pages/public/BarMenu';
import TrialSession from './pages/public/TrialSession';
import Contact from './pages/public/Contact';

// Role Portals
import MemberLayout from './pages/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberBookings from './pages/member/MemberBookings';
import MemberShop from './pages/member/MemberShop';
import MemberBarTabs from './pages/member/MemberBarTabs';
import MemberMembership from './pages/member/MemberMembership';
import MemberInvoices from './pages/member/MemberInvoices';

import FrontDeskDashboard from './pages/frontdesk/FrontDeskDashboard';
import FrontDeskEnquiries from './pages/frontdesk/FrontDeskEnquiries';
import CoachDashboard from './pages/coach/CoachDashboard';
import ShopDashboard from './pages/shop/ShopDashboard';
import BarDashboard from './pages/bar/BarDashboard';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

import { Trophy, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

function AppContent() {
  const { user, activeRole, loading, getDashboardRoute } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('home');
  const [memberTab, setMemberTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Handle browser URL hash or direct routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash) setCurrentRoute(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route) => {
    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Helper to check role authorization
  const isAuthorizedFor = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'admin' || user.roles?.includes('admin')) return true;
    return allowedRoles.some(r => user.role === r || user.roles?.includes(r));
  };

  // Render Portal or Public Page
  const renderMainView = () => {
    // 1. PUBLIC ROUTES
    if (currentRoute === 'home') return <Home onNavigate={navigateTo} onOpenAuth={openAuth} />;
    if (currentRoute === 'sports') return <Sports onNavigate={navigateTo} />;
    if (currentRoute === 'facilities') return <Facilities onNavigate={navigateTo} onOpenAuth={openAuth} />;
    if (currentRoute === 'membership') return <Membership onNavigate={navigateTo} onOpenAuth={openAuth} />;
    if (currentRoute === 'shop') return <ShopCatalog onNavigate={navigateTo} onOpenAuth={openAuth} />;
    if (currentRoute === 'bar') return <BarMenu onNavigate={navigateTo} />;
    if (currentRoute === 'trial') return <TrialSession />;
    if (currentRoute === 'contact') return <Contact />;

    // 2. MEMBER PORTAL ROUTES
    if (currentRoute === 'member' || currentRoute.startsWith('member-')) {
      if (!user) {
        return (
          <div className="text-center py-24 space-y-4">
            <h2 className="text-2xl font-bold text-white">Member Authentication Required</h2>
            <p className="text-xs text-slate-400">Please sign in to access court bookings and member privileges.</p>
            <button
              onClick={() => openAuth('login')}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950"
            >
              Sign In to Member Portal
            </button>
          </div>
        );
      }

      if (!isAuthorizedFor('member')) {
        return <AccessDenied targetRole="member" onNavigateDashboard={navigateTo} />;
      }

      // Member Layout with sub-tabs
      return (
        <MemberLayout
          currentTab={memberTab}
          onSelectTab={setMemberTab}
          onNavigatePublic={navigateTo}
        >
          {memberTab === 'dashboard' && <MemberDashboard onSelectTab={setMemberTab} />}
          {memberTab === 'bookings' && <MemberBookings />}
          {memberTab === 'shop' && <MemberShop />}
          {memberTab === 'bar' && <MemberBarTabs />}
          {memberTab === 'membership' && <MemberMembership />}
          {memberTab === 'invoices' && <MemberInvoices />}
        </MemberLayout>
      );
    }

    // 3. FRONT DESK PORTAL
    if (currentRoute === 'frontdesk' || currentRoute === 'frontdesk/enquiries') {
      if (!isAuthorizedFor('frontdesk')) {
        return <AccessDenied targetRole="front desk" onNavigateDashboard={navigateTo} />;
      }
      return <FrontDeskDashboard onNavigatePublic={navigateTo} />;
    }

    // 4. COACH PORTAL
    if (currentRoute === 'coach') {
      if (!isAuthorizedFor('coach')) {
        return <AccessDenied targetRole="coach" onNavigateDashboard={navigateTo} />;
      }
      return <CoachDashboard />;
    }

    // 5. PRO SHOP PORTAL
    if (currentRoute === 'shop-portal' || currentRoute === 'shop_portal') {
      if (!isAuthorizedFor('shop')) {
        return <AccessDenied targetRole="pro shop staff" onNavigateDashboard={navigateTo} />;
      }
      return <ShopDashboard />;
    }

    // 6. BAR & CAFETERIA PORTAL
    if (currentRoute === 'bar-portal' || currentRoute === 'bar_portal') {
      if (!isAuthorizedFor('bar')) {
        return <AccessDenied targetRole="bar & cafeteria staff" onNavigateDashboard={navigateTo} />;
      }
      return <BarDashboard />;
    }

    // 7. FINANCE PORTAL
    if (currentRoute === 'finance') {
      if (!isAuthorizedFor('finance')) {
        return <AccessDenied targetRole="finance manager" onNavigateDashboard={navigateTo} />;
      }
      return <FinanceDashboard />;
    }

    // 8. HR PORTAL
    if (currentRoute === 'hr') {
      if (!isAuthorizedFor('hr')) {
        return <AccessDenied targetRole="HR manager" onNavigateDashboard={navigateTo} />;
      }
      return <HRDashboard />;
    }

    // 9. SUPER ADMIN PORTAL
    if (currentRoute === 'admin') {
      if (!isAuthorizedFor('admin')) {
        return <AccessDenied targetRole="super admin" onNavigateDashboard={navigateTo} />;
      }
      return <AdminDashboard />;
    }

    // Fallback
    return <Home onNavigate={navigateTo} onOpenAuth={openAuth} />;
  };

  const isMemberPortalView = currentRoute === 'member' || currentRoute.startsWith('member-');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenAuth={openAuth}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {renderMainView()}
      </main>

      {/* Footer (Rendered on public and non-member-layout views) */}
      {!isMemberPortalView && (
        <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand info */}
              <div className="space-y-4 md:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Trophy className="w-4 h-4 text-slate-950" />
                  </div>
                  <span className="font-extrabold text-sm tracking-wider text-white">
                    THE CHAMPIONS CLUB
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The digital operating system for elite multi-sport athletes.
                  Championship Tennis, BWF Badminton, and Cricket practice lanes.
                </p>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  Operating 06:00 - 23:00 Daily
                </div>
              </div>

              {/* Navigation Links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Athletic Facilities</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><button onClick={() => navigateTo('sports')} className="hover:text-emerald-400">Championship Tennis</button></li>
                  <li><button onClick={() => navigateTo('sports')} className="hover:text-emerald-400">BWF Badminton Arena</button></li>
                  <li><button onClick={() => navigateTo('sports')} className="hover:text-emerald-400">Cricket Pace Lanes</button></li>
                  <li><button onClick={() => navigateTo('facilities')} className="hover:text-emerald-400">Court Availability</button></li>
                </ul>
              </div>

              {/* Membership & Shop */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Club Services</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><button onClick={() => navigateTo('membership')} className="hover:text-emerald-400">Membership Tiers</button></li>
                  <li><button onClick={() => navigateTo('shop')} className="hover:text-emerald-400">Pro Retail Shop</button></li>
                  <li><button onClick={() => navigateTo('bar')} className="hover:text-emerald-400">Clubhouse Bar & Cafe</button></li>
                  <li><button onClick={() => navigateTo('trial')} className="hover:text-emerald-400">Book Free Trial</button></li>
                </ul>
              </div>

              {/* Concierge & Address */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Grand Enclave</h4>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>450 Champions Way, Grand Sports Enclave, CA 90210</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>+1 (555) 242-6746</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>concierge@championsclub.demo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
              <div>
                © 2026 The Champions Club. All Rights Reserved. Production Sports Operating System.
              </div>
              <div className="flex items-center gap-4">
                <span>Enterprise RBAC</span>
                <span>•</span>
                <span>ACID Concurrency Engine</span>
                <span>•</span>
                <span>Encrypted JWT Sessions</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={(role) => {
          navigateTo(getDashboardRoute(role).replace('/', ''));
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
