import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  RefreshCw, 
  Bell, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "./navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Schedules', href: '/admin/schedules', icon: Calendar },
  { name: 'Swap Requests', href: '/admin/swap-requests', icon: RefreshCw },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Profile', href: '/admin/profile', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onMenuClick={toggleSidebar} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className={cn(
            "lg:col-span-1",
            // Mobile sidebar styles
            "lg:relative lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:z-auto",
            "fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop styles
            "lg:h-auto lg:w-auto lg:transform-none lg:transition-none"
          )}>
            <nav className="bg-white rounded-xl shadow-sm p-6 h-full lg:h-auto">
              {/* Mobile close button */}
              <div className="flex justify-end mb-4 lg:hidden">
                <button
                  onClick={closeSidebar}
                  className="p-2 rounded-lg text-gray-600 hover:text-physio-blue hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <li key={item.name}>
                      <Link href={item.href}>
                        <div
                          className={cn(
                            "flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer",
                            isActive
                              ? "text-physio-blue bg-physio-blue-50"
                              : "text-gray-600 hover:text-physio-blue hover:bg-physio-blue-50"
                          )}
                          onClick={closeSidebar}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
