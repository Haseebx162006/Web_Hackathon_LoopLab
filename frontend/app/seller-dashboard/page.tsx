"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { logout } from "../../store/authSlice";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  IoGridOutline, 
  IoAddCircleOutline, 
  IoListOutline, 
  IoBagHandleOutline, 
  IoTicketOutline, 
  IoStatsChartOutline, 
  IoHomeOutline, 
  IoLogOutOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoMenuOutline
} from "react-icons/io5";
import toast from "react-hot-toast";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: <IoGridOutline /> },
  { id: "product-create", label: "Product Create", icon: <IoAddCircleOutline /> },
  { id: "active-products", label: "Active Products", icon: <IoListOutline /> },
  { id: "orders", label: "Orders", icon: <IoBagHandleOutline /> },
  { id: "coupons", label: "Coupons", icon: <IoTicketOutline /> },
  { id: "analytics", label: "Sales Analytics", icon: <IoStatsChartOutline /> },
];

const SidebarItem = ({ id, label, icon, active, collapsed, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group
      ${active ? "bg-black text-white shadow-xl" : "text-gray-500 hover:bg-black/5 hover:text-black"}
    `}
  >
    <span className="text-xl shrink-0">{icon}</span>
    {!collapsed && (
      <span className="text-[13px] font-black tracking-tight whitespace-nowrap overflow-hidden">
        {label}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
        {label}
      </div>
    )}
  </button>
);

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Successfully logged out");
    router.push("/");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-10 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Revenue", value: "$12,840.00", trend: "+12.5%" },
                { label: "Orders Today", value: "24", trend: "+4" },
                { label: "Total Products", value: "148", trend: "Active" },
                { label: "Store Rating", value: "4.9/5", trend: "Premium" }
              ].map((stat, i) => (
                <div key={i} className="glass rounded-3xl p-8 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
                  <div className="flex items-baseline justify-between transition-transform duration-500 hover:translate-x-1">
                    <span className="text-2xl font-black tracking-tight">{stat.value}</span>
                    <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <section className="md:col-span-2 glass rounded-[2.5rem] p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
                      Recent Sales
                      <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                    </h2>
                    <button className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-bold text-[13px]">
                      <thead className="text-[10px] uppercase font-black tracking-widest text-gray-300 border-b border-gray-50">
                        <tr>
                          <th className="pb-4">Order ID</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[1, 2, 3].map((order) => (
                          <tr key={order} className="group hover:bg-zinc-50 transition-colors">
                            <td className="py-6">#LP-240{order}</td>
                            <td className="py-6">
                              <span className="px-3 py-1 bg-zinc-100 rounded-full text-[9px] uppercase font-black">Processing</span>
                            </td>
                            <td className="py-6">$299.00</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="glass rounded-[2.5rem] p-10 space-y-8 bg-zinc-950 text-white relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
                  <h2 className="text-xl font-black tracking-tight relative z-10">Performance</h2>
                  <div className="space-y-10 relative z-10">
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                        <span>Visibility Index</span>
                        <span>94%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[94%] bg-white rounded-full shadow-[0_0_10px_white]" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                        <span>Customer Trust</span>
                        <span>Expert</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-white rounded-full shadow-[0_0_10px_white]" />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                       <p className="text-white/60 leading-relaxed font-bold tracking-tight text-[12px]">Your boutique is currently outperforming 92% of sellers in your category.</p>
                    </div>
                  </div>
                </section>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in-up">
            <div className="h-20 w-20 rounded-3xl bg-black/5 flex items-center justify-center text-3xl text-gray-400">
               {SECTIONS.find(s => s.id === activeSection)?.icon}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">{SECTIONS.find(s => s.id === activeSection)?.label}</h2>
              <p className="text-gray-400 font-bold tracking-tight uppercase text-xs tracking-[0.3em]">This module is being optimized for your experience.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex selection:bg-black/5">
      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? "100px" : "300px" }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100 p-6 z-50 transition-all duration-500 ease-in-out shrink-0"
      >
        <div className="flex items-center justify-between mb-12 px-2">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3">
               <img src="/assets/logo/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
               <span className="font-black text-[10px] tracking-[0.5em] uppercase text-black">Loop</span>
            </Link>
          )}
          {isCollapsed && <img src="/assets/logo/logo.png" alt="Logo" className="w-8 h-8 object-contain mx-auto" />}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 h-6 w-6 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl z-[60]"
          >
            {isCollapsed ? <IoChevronForwardOutline /> : <IoChevronBackOutline />}
          </button>
        </div>

        <nav className="flex-grow space-y-2">
           <div className="px-2 mb-4">
              {!isCollapsed && <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Menu</p>}
              {isCollapsed && <div className="h-px w-full bg-gray-100 my-4" />}
           </div>
           
           {SECTIONS.map((section) => (
             <SidebarItem 
               key={section.id}
               {...section}
               active={activeSection === section.id}
               collapsed={isCollapsed}
               onClick={setActiveSection}
             />
           ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-gray-50">
           <Link href="/">
              <button className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 hover:bg-black/5 hover:text-black transition-all group relative`}>
                 <IoHomeOutline className="text-xl shrink-0" />
                 {!isCollapsed && <span className="text-[13px] font-black tracking-tight">Home</span>}
                 {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                       Home
                    </div>
                 )}
              </button>
           </Link>
           <button 
             onClick={handleLogout}
             className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all group relative`}
           >
              <IoLogOutOutline className="text-xl shrink-0" />
              {!isCollapsed && <span className="text-[13px] font-black tracking-tight">Logout</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                   Logout
                </div>
              )}
           </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 flex items-center justify-between z-[100]">
         <Link href="/" className="flex items-center gap-2">
            <img src="/assets/logo/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-[10px] tracking-[0.4em] uppercase">Loop</span>
         </Link>
         <button 
            onClick={() => setIsMobileOpen(true)}
            className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center text-xl"
         >
            <IoMenuOutline />
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
         {isMobileOpen && (
           <>
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setIsMobileOpen(false)}
                 className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
              />
              <motion.aside
                 initial={{ x: "-100%" }}
                 animate={{ x: 0 }}
                 exit={{ x: "-100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="fixed inset-y-0 left-0 w-[80%] max-w-[320px] bg-white z-[120] p-8 flex flex-col lg:hidden"
              >
                 <div className="flex items-center justify-between mb-12">
                    <span className="font-black text-xs tracking-[0.4em] uppercase">Navigation</span>
                    <button onClick={() => setIsMobileOpen(false)} className="text-2xl text-gray-400"><IoCloseOutline /></button>
                 </div>
                 
                 <nav className="space-y-4 flex-grow">
                    {SECTIONS.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => { setActiveSection(section.id); setIsMobileOpen(false); }}
                        className={`w-full flex items-center gap-6 p-2 rounded-xl transition-all ${activeSection === section.id ? "text-black scale-105" : "text-gray-400"}`}
                      >
                         <span className="text-2xl">{section.icon}</span>
                         <span className="text-base font-black uppercase tracking-tighter">{section.label}</span>
                      </button>
                    ))}
                 </nav>

                 <div className="space-y-4 pt-8 border-t border-gray-100">
                    <Link href="/" className="flex items-center gap-6 p-2 text-gray-400 font-bold uppercase tracking-widest text-xs">
                       <IoHomeOutline className="text-xl" /> Home
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-6 p-2 text-red-500 font-bold uppercase tracking-widest text-xs">
                       <IoLogOutOutline className="text-xl" /> Logout
                    </button>
                 </div>
              </motion.aside>
           </>
         )}
      </AnimatePresence>

      {/* Content Area */}
      <main className="flex-grow pt-28 lg:pt-0 min-h-screen">
         <header className="hidden lg:flex items-center justify-between p-10 bg-white/50 border-b border-gray-50 backdrop-blur-sm">
            <div className="space-y-1">
               <h2 className="text-xs font-black uppercase tracking-[0.5em] text-gray-300">Vanguard / {activeSection.replace('-', ' ')}</h2>
               <h1 className="text-3xl font-black uppercase tracking-tighter text-black">
                  {user?.storeName || "Private Boutique"}
               </h1>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticated as</p>
                  <p className="text-xs font-black uppercase tracking-widest">{user?.ownerName || "Merchant"}</p>
               </div>
               <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white font-black text-xl shadow-xl">
                  {user?.storeName?.charAt(0) || "S"}
               </div>
            </div>
         </header>

         <div className="p-6 md:p-10 lg:p-16">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

// Simple Fallback icon for mobile close button since IoCloseOutline wasn't imported from io5 (using i5 icon name)
const IoCloseOutline = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M368 368L144 144m224 0L144 368"></path>
  </svg>
);

export default DashboardPage;
