import { NavLink } from "react-router-dom";
import { Compass, Home, MessagesSquare, UserRound } from "lucide-react";

const navItems = [
  { to: "/feed", label: "动态", icon: Home },
  { to: "/explore", label: "探索", icon: Compass },
  { to: "/messages", label: "消息", icon: MessagesSquare },
  { to: "/profile", label: "我的", icon: UserRound },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-black/[0.08] bg-white/95 px-3 pb-3 pt-2 shadow-[0_-10px_30px_rgba(70,45,20,0.08)] backdrop-blur">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold ${
                isActive ? "text-[#C4643A]" : "text-[#8D837A]"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
